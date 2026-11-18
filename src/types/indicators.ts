export type CategoryId =
  | 'mercados'
  | 'precios'
  | 'actividad'
  | 'ingresos'
  | 'sociedad'
  | 'externo'
  | 'finanzas';

export interface CategoryTab {
  id: CategoryId;
  label: string;
}

export type UnitType =
  | 'ars'
  | 'usd'
  | 'usd_m'
  | 'ars_m'
  | 'ars_b'
  | 'pct'
  | 'pts'
  | 'idx';

export type ChangeMode = 'pct' | 'pp' | 'pts';

export interface SeriesPoint {
  date: string;
  label: string;
  value: number;
  changeValue: number | null;
}

export interface SubcomponentItem {
  name: string;
  sharePct: number;
  detail?: string;
}

export interface IndicatorData {
  id: string;
  category: CategoryId;
  title: string;
  subtitle: string;
  source: string;
  unitType: UnitType;
  unitSuffix: string;
  unitPrefix?: string;
  decimals: number;
  currentValue: number;
  currentDate: string;
  changeValue: number | null;
  changeMode: ChangeMode;
  changeLabel: string;
  minValue: number;
  maxValue: number;
  series: SeriesPoint[];
  fullSeries: SeriesPoint[];
  frequencyLabel: string;
  updatedAtLabel: string;
  apiFetchedAt: string;
  isLiveApi: boolean;
  liveSubcomponents?: SubcomponentItem[];
}

export interface NewsArticle {
  title: string;
  source: string;
  link: string;
  pubDate: string;
  relativeTime: string;
}
