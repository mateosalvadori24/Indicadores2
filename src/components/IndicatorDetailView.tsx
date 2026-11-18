import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FALLBACK_NEWS_BY_CATEGORY,
  INDICATOR_INSIGHTS,
} from '../data/indicatorInsights';
import { fetchIndicatorNews } from '../services/indicatorsApi';
import type {
  IndicatorData,
  NewsArticle,
  SeriesPoint,
} from '../types/indicators';
import {
  formatArgNumber,
  formatChange,
  formatCompactValue,
  formatPrimaryValue,
  formatTooltipDate,
} from '../utils/formatters';

type TimeRange = '1A' | '5A' | '10A' | 'MAX';
type ChartViewMode = 'level' | 'yoy';

interface EnrichedPoint extends SeriesPoint {
  yoyValue: number | null;
}

interface IndicatorDetailViewProps {
  indicator: IndicatorData;
  categoryLabel: string;
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function getDateMode(
  frequencyLabel: string
): 'daily' | 'monthly' | 'quarterly' | 'semiannual' {
  const lower = frequencyLabel.toLowerCase();
  if (lower.includes('diario')) return 'daily';
  if (lower.includes('trim')) return 'quarterly';
  if (lower.includes('semes')) return 'semiannual';
  return 'monthly';
}

function computeEnrichedSeries(
  points: SeriesPoint[],
  unitType: IndicatorData['unitType']
): EnrichedPoint[] {
  const timestamps = points.map((p) => Date.parse(p.date));
  const isRate = unitType === 'pct';

  return points.map((point, idx) => {
    const targetTs = timestamps[idx] - 365 * 24 * 60 * 60 * 1000;
    let bestIdx = -1;
    let bestDiff = Infinity;

    for (let j = idx - 1; j >= 0; j--) {
      const diff = Math.abs(timestamps[j] - targetTs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = j;
      }
      if (timestamps[j] < targetTs - 35 * 24 * 60 * 60 * 1000) {
        break;
      }
    }

    let yoyValue: number | null = null;
    const maxToleranceMs = 30 * 24 * 60 * 60 * 1000;
    if (bestIdx >= 0 && bestDiff <= maxToleranceMs) {
      const prevYearVal = points[bestIdx].value;
      if (isRate) {
        yoyValue = point.value - prevYearVal;
      } else if (prevYearVal !== 0) {
        yoyValue = ((point.value - prevYearVal) / Math.abs(prevYearVal)) * 100;
      }
    }

    return {
      ...point,
      yoyValue,
    };
  });
}

function filterByRange(
  points: EnrichedPoint[],
  range: TimeRange
): EnrichedPoint[] {
  if (range === 'MAX' || points.length === 0) return points;
  const years = range === '1A' ? 1 : range === '5A' ? 5 : 10;
  const lastTs = Date.parse(points[points.length - 1].date);
  const cutoffTs = lastTs - years * 365.25 * 24 * 60 * 60 * 1000;
  const filtered = points.filter((p) => Date.parse(p.date) >= cutoffTs);
  return filtered.length >= 2 ? filtered : points.slice(-Math.min(points.length, 12));
}

function downsampleForChart(
  points: EnrichedPoint[],
  maxPoints = 360
): EnrichedPoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled: EnrichedPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1]?.date !== last.date) {
    sampled.push(last);
  }
  return sampled;
}

interface DetailTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: EnrichedPoint }>;
  indicator: IndicatorData;
  dateMode: 'daily' | 'monthly' | 'quarterly' | 'semiannual';
  chartMode: ChartViewMode;
}

function DetailTooltip({
  active,
  payload,
  indicator,
  dateMode,
  chartMode,
}: DetailTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const valStr = formatCompactValue(
    point.value,
    indicator.unitType,
    indicator.decimals
  );
  const periodChange = formatChange(point.changeValue, indicator.changeMode);
  const isRate = indicator.unitType === 'pct';
  const yoyStr =
    point.yoyValue !== null
      ? `${point.yoyValue > 0 ? '+' : ''}${formatArgNumber(point.yoyValue, 2)}${
          isRate ? ' pp i.a.' : '% i.a.'
        }`
      : 'Sin dato i.a.';

  const activeDelta =
    chartMode === 'yoy'
      ? point.yoyValue
      : point.changeValue;
  const activeDeltaColor =
    activeDelta === null
      ? 'text-[#9CA3AF]'
      : activeDelta > 0
      ? 'text-[#22C55E]'
      : activeDelta < 0
      ? 'text-[#EF4444]'
      : 'text-[#9CA3AF]';

  return (
    <div className="bg-[#0B0E11]/95 border border-[#2C3340] rounded-xl px-4 py-3 shadow-2xl pointer-events-none">
      <p className="text-xs font-medium text-[#9CA3AF] mb-1">
        {formatTooltipDate(point.date, dateMode)}
      </p>
      {chartMode === 'level' ? (
        <>
          <p className="text-lg font-bold text-white font-mono tabular-nums leading-tight">
            {valStr}
          </p>
          <p className={`text-xs font-medium tabular-nums mt-1 ${activeDeltaColor}`}>
            {periodChange.direction === 'up'
              ? '▲ '
              : periodChange.direction === 'down'
              ? '▼ '
              : ''}
            {periodChange.text} {indicator.changeLabel}
          </p>
          {point.yoyValue !== null && (
            <p className="text-[11px] text-[#9CA3AF] tabular-nums mt-0.5">
              Interanual: {yoyStr}
            </p>
          )}
        </>
      ) : (
        <>
          <p
            className={`text-lg font-bold font-mono tabular-nums leading-tight ${activeDeltaColor}`}
          >
            {yoyStr}
          </p>
          <p className="text-xs text-[#E5E7EB] font-mono tabular-nums mt-1">
            Nivel: {valStr}
          </p>
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 15;

export function IndicatorDetailView({
  indicator,
  categoryLabel,
  onBack,
  onRefresh,
  isRefreshing,
}: IndicatorDetailViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('5A');
  const [chartMode, setChartMode] = useState<ChartViewMode>('level');
  const [page, setPage] = useState(1);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const dateMode = getDateMode(indicator.frequencyLabel);
  const insight = INDICATOR_INSIGHTS[indicator.id];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setPage(1);
    setChartMode('level');
    setTimeRange(indicator.fullSeries.length > 60 ? '5A' : 'MAX');
  }, [indicator.id, indicator.fullSeries.length]);

  useEffect(() => {
    let cancelled = false;
    setLoadingNews(true);

    const query = insight?.newsQuery ?? `${indicator.title} argentina economia`;
    fetchIndicatorNews(query)
      .then((items) => {
        if (cancelled) return;
        if (items.length > 0) {
          setNews(items.slice(0, 4));
        } else {
          setNews(FALLBACK_NEWS_BY_CATEGORY[indicator.category]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setNews(FALLBACK_NEWS_BY_CATEGORY[indicator.category]);
      })
      .finally(() => {
        if (!cancelled) setLoadingNews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [indicator.id, indicator.category, indicator.title, insight?.newsQuery]);

  const enrichedFull = useMemo(
    () => computeEnrichedSeries(indicator.fullSeries, indicator.unitType),
    [indicator.fullSeries, indicator.unitType]
  );

  // Historical stats across full series
  const historicalStats = useMemo(() => {
    if (enrichedFull.length === 0) {
      return {
        maxPoint: null as EnrichedPoint | null,
        minPoint: null as EnrichedPoint | null,
      };
    }
    let maxPt = enrichedFull[0];
    let minPt = enrichedFull[0];
    for (const pt of enrichedFull) {
      if (pt.value > maxPt.value) maxPt = pt;
      if (pt.value < minPt.value) minPt = pt;
    }
    return { maxPoint: maxPt, minPoint: minPt };
  }, [enrichedFull]);

  const rangedSeries = useMemo(
    () => filterByRange(enrichedFull, timeRange),
    [enrichedFull, timeRange]
  );

  const chartSeries = useMemo(() => {
    const base =
      chartMode === 'yoy'
        ? rangedSeries.filter((p) => p.yoyValue !== null)
        : rangedSeries;
    return downsampleForChart(base, 360);
  }, [rangedSeries, chartMode]);

  const hasYoyData = useMemo(
    () => rangedSeries.some((p) => p.yoyValue !== null),
    [rangedSeries]
  );

  const primary = formatPrimaryValue(
    indicator.currentValue,
    indicator.unitType,
    indicator.decimals
  );
  const lastChange = formatChange(indicator.changeValue, indicator.changeMode);
  const changeColor =
    lastChange.direction === 'up'
      ? 'text-[#22C55E]'
      : lastChange.direction === 'down'
      ? 'text-[#EF4444]'
      : 'text-[#9CA3AF]';
  const changeArrow =
    lastChange.direction === 'up'
      ? '▲ '
      : lastChange.direction === 'down'
      ? '▼ '
      : '';

  const yDomainLevel = useMemo<[number, number]>(() => {
    if (chartSeries.length === 0) return [0, 1];
    const vals = chartSeries.map((c) => c.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min;
    const pad = span > 0 ? span * 0.12 : Math.abs(max) * 0.05 || 1;
    return [min - pad, max + pad];
  }, [chartSeries]);

  const subcomponents = indicator.liveSubcomponents ?? insight?.subcomponents;
  const subcomponentsTitle =
    insight?.subcomponentsTitle ?? 'Composición de referencia';

  // Pagination (newest first)
  const tableRows = useMemo(() => [...enrichedFull].reverse(), [enrichedFull]);
  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = tableRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const startRow = tableRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(safePage * PAGE_SIZE, tableRows.length);

  const handleDownloadCsv = () => {
    const header = 'Fecha;Periodo;Valor;Variacion_Periodo;Variacion_Interanual\n';
    const isRate = indicator.unitType === 'pct';
    const body = tableRows
      .map((pt) => {
        const ch = formatChange(pt.changeValue, indicator.changeMode).text;
        const yoy =
          pt.yoyValue !== null
            ? `${formatArgNumber(pt.yoyValue, 2)}${isRate ? ' pp' : '%'}`
            : '';
        return `${pt.date};"${formatTooltipDate(pt.date, dateMode)}";"${formatArgNumber(
          pt.value,
          indicator.decimals
        )}";"${ch}";"${yoy}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + body], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${indicator.id}-serie-historica.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const gradId = `detail-grad-${indicator.id}`;
  const isRate = indicator.unitType === 'pct';

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full surface-pill text-sm font-medium text-white cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver a Indicadores
        </button>

        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <span>Indicadores</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#9CA3AF]">{categoryLabel}</span>
          <span aria-hidden="true">/</span>
          <span className="text-white truncate max-w-[220px]">{indicator.title}</span>
        </div>
      </div>

      {/* 1. Header del Indicador + 4 Métricas Resumen */}
      <section className="surface-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">
              {indicator.source} · Frecuencia {indicator.frequencyLabel}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
              {indicator.title}
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-1">{indicator.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{indicator.updatedAtLabel}</span>
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full surface-pill text-xs font-medium text-[#E5E7EB] hover:text-white transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Actualizar ahora
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t surface-divider grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/10">
          <div className="lg:pr-6">
            <span className="block text-xs font-medium text-[#9CA3AF]">
              Último valor
            </span>
            <div className="mt-1.5 flex items-baseline gap-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#E86A24]">
              {primary.prefix && (
                <span className="text-lg sm:text-xl font-semibold">
                  {primary.prefix.trim()}
                </span>
              )}
              <span>{primary.formatted}</span>
              {primary.suffix && (
                <span className="text-base sm:text-lg font-semibold">
                  {primary.suffix}
                </span>
              )}
            </div>
            <span className="block text-xs text-[#6B7280] mt-1">
              {formatTooltipDate(indicator.currentDate, dateMode)}
            </span>
          </div>

          <div className="lg:px-6">
            <span className="block text-xs font-medium text-[#9CA3AF]">
              Variación anterior
            </span>
            <span
              className={`block text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1.5 ${changeColor}`}
            >
              {changeArrow}
              {lastChange.text}
            </span>
            <span className="block text-xs text-[#6B7280] mt-1">
              {indicator.changeLabel}
            </span>
          </div>

          <div className="lg:px-6">
            <span className="block text-xs font-medium text-[#9CA3AF]">
              Máximo histórico
            </span>
            <span className="block text-xl sm:text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {historicalStats.maxPoint
                ? formatCompactValue(
                    historicalStats.maxPoint.value,
                    indicator.unitType,
                    indicator.decimals
                  )
                : '—'}
            </span>
            <span className="block text-xs text-[#6B7280] mt-1">
              {historicalStats.maxPoint
                ? formatTooltipDate(historicalStats.maxPoint.date, dateMode)
                : ''}
            </span>
          </div>

          <div className="lg:pl-6">
            <span className="block text-xs font-medium text-[#9CA3AF]">
              Mínimo histórico
            </span>
            <span className="block text-xl sm:text-2xl font-bold text-white font-mono tabular-nums mt-1.5">
              {historicalStats.minPoint
                ? formatCompactValue(
                    historicalStats.minPoint.value,
                    indicator.unitType,
                    indicator.decimals
                  )
                : '—'}
            </span>
            <span className="block text-xs text-[#6B7280] mt-1">
              {historicalStats.minPoint
                ? formatTooltipDate(historicalStats.minPoint.date, dateMode)
                : ''}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Gráfico Histórico Interactivo Ampliado */}
      <section className="surface-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Toggle Vista de Nivel vs Variación Interanual */}
          <div className="inline-flex items-center p-1 rounded-full surface-inset border self-start">
            <button
              type="button"
              onClick={() => setChartMode('level')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                chartMode === 'level'
                  ? 'bg-white text-[#0B0E11] font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Vista de Nivel (Línea)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('yoy')}
              disabled={!hasYoyData}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                chartMode === 'yoy'
                  ? 'bg-white text-[#0B0E11] font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Variación Interanual (Barras)
            </button>
          </div>

          {/* Selector de rango temporal */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['1A', '5A', '10A', 'MAX'] as const).map((r) => {
              const label = r === 'MAX' ? 'Máx' : r;
              const isActive = timeRange === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#0B0E11] font-semibold'
                      : 'surface-pill text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[320px] sm:h-[360px] w-full">
          {chartSeries.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-[#9CA3AF]">
              No hay suficientes períodos previos en este rango para calcular la variación interanual.
            </div>
          ) : chartMode === 'level' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartSeries}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E86A24" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#E86A24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1F242D"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={36}
                  dy={8}
                />
                <YAxis
                  domain={yDomainLevel}
                  width={68}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    formatArgNumber(v, Math.abs(v) >= 1000 ? 0 : indicator.decimals)
                  }
                />
                <Tooltip
                  content={
                    <DetailTooltip
                      indicator={indicator}
                      dateMode={dateMode}
                      chartMode="level"
                    />
                  }
                  cursor={{
                    stroke: '#374151',
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#E86A24"
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                  activeDot={{
                    r: 5,
                    fill: '#E86A24',
                    stroke: '#0B0E11',
                    strokeWidth: 2,
                  }}
                  dot={(props: { cx?: number; cy?: number; index?: number }) => {
                    if (
                      props.index !== chartSeries.length - 1 ||
                      props.cx == null ||
                      props.cy == null
                    ) {
                      return <g key={`d-empty-${props.index}`} />;
                    }
                    return (
                      <g key={`d-last-${props.index}`}>
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={8}
                          fill="#E86A24"
                          fillOpacity={0.24}
                        />
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={4}
                          fill="#E86A24"
                          stroke="#0B0E11"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartSeries}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#1F242D"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={36}
                  dy={8}
                />
                <YAxis
                  width={62}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    `${formatArgNumber(v, 1)}${isRate ? ' pp' : '%'}`
                  }
                />
                <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
                <Tooltip
                  content={
                    <DetailTooltip
                      indicator={indicator}
                      dateMode={dateMode}
                      chartMode="yoy"
                    />
                  }
                  cursor={{ fill: '#1F242D', opacity: 0.35 }}
                />
                <Bar
                  dataKey="yoyValue"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                >
                  {chartSeries.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={(entry.yoyValue ?? 0) >= 0 ? '#22C55E' : '#EF4444'}
                      fillOpacity={0.88}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 3. Desglose y Explicación ("¿Qué mide este indicador?") */}
      <section className="surface-card rounded-2xl p-6 sm:p-8">
        <div
          className={`grid grid-cols-1 ${
            subcomponents && subcomponents.length > 0 ? 'lg:grid-cols-12' : ''
          } gap-8`}
        >
          <div
            className={
              subcomponents && subcomponents.length > 0 ? 'lg:col-span-6' : ''
            }
          >
            <h3 className="text-lg font-bold text-white">
              ¿Qué mide este indicador?
            </h3>
            <p className="text-sm text-[#D1D5DB] leading-relaxed mt-3">
              {insight?.description ??
                `Serie estadística oficial de ${indicator.title} relevada por ${indicator.source} con periodicidad ${indicator.frequencyLabel.toLowerCase()}.`}
            </p>
            <div className="mt-5 pt-5 border-t surface-divider">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Impacto en la economía real
              </h4>
              <p className="text-sm text-[#9CA3AF] leading-relaxed mt-2">
                {insight?.economicImpact ??
                  'Permite monitorear la evolución macroeconómica y sirve como insumo clave para decisiones de consumo, inversión y política pública.'}
              </p>
            </div>
          </div>

          {subcomponents && subcomponents.length > 0 && (
            <div className="lg:col-span-6 lg:pl-8 lg:border-l surface-divider">
              <h3 className="text-sm font-semibold text-white mb-4">
                {subcomponentsTitle}
              </h3>
              <div className="space-y-4">
                {subcomponents.map((sub) => (
                  <div key={sub.name}>
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm mb-1.5">
                      <span className="text-[#D1D5DB] truncate">{sub.name}</span>
                      <span className="font-mono tabular-nums font-semibold text-white shrink-0">
                        {sub.detail ?? `${formatArgNumber(sub.sharePct, 1)}%`}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1F242D] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E86A24]"
                        style={{
                          width: `${Math.min(100, Math.max(4, sub.sharePct))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Sección Noticias Relacionadas */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-white">Noticias relacionadas</h3>
          <span className="text-xs text-[#6B7280]">
            Medios económicos de Argentina
          </span>
        </div>

        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="surface-card rounded-2xl p-5 h-[132px] animate-pulse"
              >
                <div className="h-3 w-36 bg-[#1F242D] rounded" />
                <div className="h-4 w-full bg-[#1F242D] rounded mt-3" />
                <div className="h-4 w-3/4 bg-[#1A1F27] rounded mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((article, idx) => (
              <a
                key={`${article.link}-${idx}`}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-[#E86A24] truncate">
                      {article.source}
                    </span>
                    <span className="text-[#6B7280]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#6B7280] shrink-0">
                      {article.relativeTime}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white leading-snug mt-2 group-hover:text-[#F3F4F6]">
                    {article.title}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] group-hover:text-white transition-colors">
                  Leer en el medio
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 5. Tabla Histórica Paginada + Exportación CSV */}
      <section className="surface-card rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b surface-divider flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Serie histórica completa
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
              {tableRows.length} períodos registrados · ordenados del más reciente al más antiguo
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#0B0E11] text-xs font-semibold hover:bg-[#E5E7EB] transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Descargar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b surface-inset">
              <tr>
                <th className="py-3 px-6 text-xs font-medium text-[#9CA3AF]">
                  Período
                </th>
                <th className="py-3 px-6 text-xs font-medium text-[#9CA3AF] text-right">
                  Valor
                </th>
                <th className="py-3 px-6 text-xs font-medium text-[#9CA3AF] text-right">
                  Var. período anterior
                </th>
                <th className="py-3 px-6 text-xs font-medium text-[#9CA3AF] text-right">
                  Var. interanual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F242D]/70">
              {pagedRows.map((point) => {
                const ch = formatChange(point.changeValue, indicator.changeMode);
                const chColor =
                  ch.direction === 'up'
                    ? 'text-[#22C55E]'
                    : ch.direction === 'down'
                    ? 'text-[#EF4444]'
                    : 'text-[#6B7280]';
                const chArrow =
                  ch.direction === 'up'
                    ? '▲ '
                    : ch.direction === 'down'
                    ? '▼ '
                    : '';

                const yoyVal = point.yoyValue;
                const yoyColor =
                  yoyVal === null
                    ? 'text-[#6B7280]'
                    : yoyVal > 0
                    ? 'text-[#22C55E]'
                    : yoyVal < 0
                    ? 'text-[#EF4444]'
                    : 'text-[#6B7280]';
                const yoyText =
                  yoyVal === null
                    ? '—'
                    : `${yoyVal > 0 ? '▲ +' : yoyVal < 0 ? '▼ -' : ''}${formatArgNumber(
                        Math.abs(yoyVal),
                        2
                      )}${isRate ? ' pp' : '%'}`;

                return (
                  <tr
                    key={point.date}
                    className="hover:bg-[#171C24] transition-colors"
                  >
                    <td className="py-3 px-6 text-sm text-[#E5E7EB] whitespace-nowrap">
                      {formatTooltipDate(point.date, dateMode)}
                    </td>
                    <td className="py-3 px-6 text-sm font-semibold text-white font-mono tabular-nums text-right whitespace-nowrap">
                      {formatCompactValue(
                        point.value,
                        indicator.unitType,
                        indicator.decimals
                      )}
                    </td>
                    <td
                      className={`py-3 px-6 text-sm font-medium font-mono tabular-nums text-right whitespace-nowrap ${chColor}`}
                    >
                      {chArrow}
                      {ch.text}
                    </td>
                    <td
                      className={`py-3 px-6 text-sm font-medium font-mono tabular-nums text-right whitespace-nowrap ${yoyColor}`}
                    >
                      {yoyText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t surface-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-[#6B7280] tabular-nums">
              Mostrando {startRow}–{endRow} de {tableRows.length} registros · Página{' '}
              {safePage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full surface-pill text-xs font-medium text-[#E5E7EB] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full surface-pill text-xs font-medium text-[#E5E7EB] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
