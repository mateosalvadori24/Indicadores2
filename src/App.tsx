import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CardSkeleton } from './components/CardSkeleton';
import { IndicatorCard } from './components/IndicatorCard';
import { IndicatorDetailView } from './components/IndicatorDetailView';
import { fetchCategoryIndicators } from './services/indicatorsApi';
import type { CategoryId, CategoryTab, IndicatorData } from './types/indicators';
import { formatBuenosAiresTimeOnly } from './utils/formatters';

type ThemeMode = 'ambient' | 'classic';
const THEME_STORAGE_KEY = 'indicadores-theme-mode';

function getInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'classic' || saved === 'ambient') return saved;
  } catch {
    // Ignore storage access errors
  }
  return 'ambient';
}

const CATEGORIES: CategoryTab[] = [
  { id: 'mercados', label: 'Mercados y Dólar' },
  { id: 'precios', label: 'Precios' },
  { id: 'actividad', label: 'Actividad y PBI' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'sociedad', label: 'Sociedad' },
  { id: 'externo', label: 'Sector externo' },
  { id: 'finanzas', label: 'Finanzas públicas' },
];

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('mercados');
  const [indicatorsByCategory, setIndicatorsByCategory] = useState<
    Partial<Record<CategoryId, IndicatorData[]>>
  >({});
  const [loadingCategory, setLoadingCategory] = useState<CategoryId | null>('mercados');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const inFlightRef = useRef<Set<CategoryId>>(new Set());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ambient', 'theme-classic');
    root.classList.add(theme === 'ambient' ? 'theme-ambient' : 'theme-classic');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access errors
    }
  }, [theme]);

  const loadCategory = useCallback(
    async (category: CategoryId, force = false) => {
      if (!force && indicatorsByCategory[category]) {
        setLoadingCategory(null);
        setErrorMsg(null);
        return;
      }
      if (inFlightRef.current.has(category)) return;

      inFlightRef.current.add(category);
      if (!indicatorsByCategory[category]) {
        setLoadingCategory(category);
      } else {
        setIsRefreshing(true);
      }
      setErrorMsg(null);

      try {
        const data = await fetchCategoryIndicators(category);
        setIndicatorsByCategory((prev) => ({
          ...prev,
          [category]: data,
        }));
        setSelectedIndicator((curr) => {
          if (!curr || curr.category !== category) return curr;
          return data.find((item) => item.id === curr.id) ?? curr;
        });
        setLastUpdated(new Date());
      } catch {
        setErrorMsg(
          'No se pudieron cargar los datos en este momento. Verificá tu conexión e intentá nuevamente.'
        );
      } finally {
        inFlightRef.current.delete(category);
        setLoadingCategory((curr) => (curr === category ? null : curr));
        setIsRefreshing(false);
      }
    },
    [indicatorsByCategory]
  );

  useEffect(() => {
    void loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  const handleRefresh = () => {
    const targetCategory = selectedIndicator?.category ?? activeCategory;
    void loadCategory(targetCategory, true);
  };

  const currentCards = indicatorsByCategory[activeCategory];
  const isInitialLoading = loadingCategory === activeCategory && !currentCards;

  const formattedTime = lastUpdated
    ? formatBuenosAiresTimeOnly(lastUpdated)
    : null;

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.id === activeCategory)?.label ?? '';

  const selectedCategoryLabel = selectedIndicator
    ? CATEGORIES.find((c) => c.id === selectedIndicator.category)?.label ??
      activeCategoryLabel
    : activeCategoryLabel;

  return (
    <div
      className={`min-h-screen app-canvas text-[#F3F4F6] flex flex-col relative ${
        theme === 'ambient' ? 'theme-ambient' : 'theme-classic'
      }`}
    >
      {/* Subtle Ambient Animated Background Canvas (Active only in theme-ambient) */}
      {theme === 'ambient' && (
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden z-0"
          aria-hidden="true"
        >
          <div className="absolute inset-0 ambient-grid" />
          <div className="absolute -top-[180px] -left-[140px] w-[560px] h-[560px] rounded-full ambient-orb ambient-orb-blue" />
          <div className="absolute top-[12%] -right-[160px] w-[520px] h-[520px] rounded-full ambient-orb ambient-orb-amber" />
          <div className="absolute -bottom-[200px] left-[28%] w-[600px] h-[600px] rounded-full ambient-orb ambient-orb-deep" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-14 flex-1">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0"
                aria-hidden="true"
              />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#9CA3AF]">
                ECONOMÍA ARGENTINA · EN TIEMPO REAL
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              Indicadores
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            {formattedTime && (
              <span className="text-xs text-[#6B7280] font-mono tabular-nums whitespace-nowrap">
                Actualizado {formattedTime}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isInitialLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full surface-pill text-xs font-medium text-[#E5E7EB] hover:text-white cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing || isInitialLoading ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
              Actualizar
            </button>

            {/* Discreet Theme Switcher Pill */}
            <div
              role="group"
              aria-label="Selector de estilo visual"
              className="inline-flex items-center gap-1 p-1 rounded-full surface-pill shrink-0"
            >
              <span className="pl-2 pr-1 text-[11px] font-medium text-[#6B7280] whitespace-nowrap select-none">
                Estilo:
              </span>
              <button
                type="button"
                onClick={() => setTheme('ambient')}
                aria-pressed={theme === 'ambient'}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  theme === 'ambient'
                    ? 'bg-white text-[#0B0E11] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Atmosférico
              </button>
              <button
                type="button"
                onClick={() => setTheme('classic')}
                aria-pressed={theme === 'classic'}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  theme === 'classic'
                    ? 'bg-white text-[#0B0E11] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Clásico
              </button>
            </div>
          </div>
        </header>

        {selectedIndicator ? (
          <main className="mt-7">
            <IndicatorDetailView
              indicator={selectedIndicator}
              categoryLabel={selectedCategoryLabel}
              onBack={() => setSelectedIndicator(null)}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </main>
        ) : (
          <>
            {/* Horizontal Pill Navigation */}
            <nav
              aria-label="Categorías de indicadores"
              className="mt-7 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar"
            >
              <div className="flex items-center gap-2.5 min-w-max pb-1">
                {CATEGORIES.map((tab) => {
                  const isActive = tab.id === activeCategory;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      aria-pressed={isActive}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A24] ${
                        isActive
                          ? 'bg-white text-[#0B0E11] font-semibold'
                          : 'surface-pill text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content Grid */}
            <main className="mt-7">
              {errorMsg && !currentCards ? (
                <div className="surface-card rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#E5E7EB]">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 rounded-full bg-white text-[#0B0E11] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              ) : isInitialLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : currentCards && currentCards.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentCards.map((indicator) => (
                    <IndicatorCard
                      key={indicator.id}
                      indicator={indicator}
                      onOpenDetail={setSelectedIndicator}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-card rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">
                    No hay indicadores disponibles para esta categoría en este momento.
                  </p>
                </div>
              )}
            </main>
          </>
        )}

        {/* Discreet Footer */}
        <footer className="mt-10 pt-6 border-t surface-divider text-center">
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Pasá el dedo o el cursor por el gráfico para ver el valor exacto de cada período y su variación respecto al anterior.
          </p>
        </footer>
      </div>
    </div>
  );
}
