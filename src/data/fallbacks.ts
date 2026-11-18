import type { SeriesPoint } from '../types/indicators';

function buildSeries(
  raw: Array<[string, number]>,
  labelBuilder: (d: string) => string,
  changeMode: 'pct' | 'pp' | 'pts' = 'pct'
): SeriesPoint[] {
  return raw.map(([date, value], idx) => {
    let changeValue: number | null = null;
    if (idx > 0) {
      const prev = raw[idx - 1][1];
      if (changeMode === 'pct') {
        changeValue = prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
      } else {
        changeValue = value - prev;
      }
    }
    return {
      date,
      label: labelBuilder(date),
      value,
      changeValue,
    };
  });
}

const fmtM = (d: string) => {
  const [y, m] = d.split('-');
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${names[Number(m) - 1] ?? m} '${y.slice(-2)}`;
};

const fmtQ = (d: string) => {
  const [y, m] = d.split('-');
  const q = Math.ceil(Number(m) / 3);
  return `T${q} '${y.slice(-2)}`;
};

const fmtS = (d: string) => {
  const [y, m] = d.split('-');
  const s = Number(m) <= 6 ? 'S1' : 'S2';
  return `${s} '${y.slice(-2)}`;
};

// Indigencia (Personas - INDEC EPH Semestral, % de personas)
export const INDIGENCIA_INDEC_SERIES: SeriesPoint[] = buildSeries(
  [
    ['2019-01-01', 7.7],
    ['2019-07-01', 8.0],
    ['2020-01-01', 10.5],
    ['2020-07-01', 10.5],
    ['2021-01-01', 10.7],
    ['2021-07-01', 8.2],
    ['2022-01-01', 8.8],
    ['2022-07-01', 8.1],
    ['2023-01-01', 9.3],
    ['2023-07-01', 11.9],
    ['2024-01-01', 18.1],
    ['2024-07-01', 8.2],
    ['2025-01-01', 7.4],
    ['2025-07-01', 6.8],
    ['2026-01-01', 6.4],
  ],
  fmtS,
  'pp'
);

// Fallbacks for Actividad y PBI if datos.gob.ar times out
export const FALLBACK_EMAE_DESEST: SeriesPoint[] = buildSeries(
  [
    ['2025-09-01', 146.2],
    ['2025-10-01', 147.1],
    ['2025-11-01', 148.0],
    ['2025-12-01', 148.5],
    ['2026-01-01', 147.9],
    ['2026-02-01', 148.4],
    ['2026-03-01', 149.1],
    ['2026-04-01', 149.4],
    ['2026-05-01', 150.2],
    ['2026-06-01', 149.6],
    ['2026-07-01', 149.5],
    ['2026-08-01', 149.89],
  ],
  fmtM,
  'pct'
);

export const FALLBACK_EMAE_ORIG: SeriesPoint[] = buildSeries(
  [
    ['2025-09-01', 145.4],
    ['2025-10-01', 148.2],
    ['2025-11-01', 146.8],
    ['2025-12-01', 147.0],
    ['2026-01-01', 141.3],
    ['2026-02-01', 139.8],
    ['2026-03-01', 148.7],
    ['2026-04-01', 162.37],
    ['2026-05-01', 166.25],
    ['2026-06-01', 161.66],
    ['2026-07-01', 151.51],
    ['2026-08-01', 147.75],
  ],
  fmtM,
  'pct'
);

export const FALLBACK_PBI_CONST: SeriesPoint[] = buildSeries(
  [
    ['2024-04-01', 691200],
    ['2024-07-01', 705400],
    ['2024-10-01', 718900],
    ['2025-01-01', 710400],
    ['2025-04-01', 754100],
    ['2025-07-01', 748600],
    ['2025-10-01', 735202],
    ['2026-01-01', 726163],
    ['2026-04-01', 792800],
  ],
  fmtQ,
  'pct'
);

export const FALLBACK_PBI_PER_CAPITA: SeriesPoint[] = buildSeries(
  [
    ['2024-04-01', 15020],
    ['2024-07-01', 15310],
    ['2024-10-01', 15580],
    ['2025-01-01', 15360],
    ['2025-04-01', 16280],
    ['2025-07-01', 16140],
    ['2025-10-01', 15842],
    ['2026-01-01', 15641],
    ['2026-04-01', 17069],
  ],
  fmtQ,
  'pct'
);

export const FALLBACK_CONSUMO_PRIVADO: SeriesPoint[] = buildSeries(
  [
    ['2024-04-01', 498100],
    ['2024-07-01', 512400],
    ['2024-10-01', 528900],
    ['2025-01-01', 536200],
    ['2025-04-01', 548100],
    ['2025-07-01', 553900],
    ['2025-10-01', 561036],
    ['2026-01-01', 563779],
    ['2026-04-01', 550315],
  ],
  fmtQ,
  'pct'
);

export const FALLBACK_INVERSION_FBCF: SeriesPoint[] = buildSeries(
  [
    ['2024-01-01', 88400],
    ['2024-04-01', 96200],
    ['2024-07-01', 109800],
    ['2024-10-01', 124500],
    ['2025-01-01', 131200],
    ['2025-04-01', 141554],
    ['2025-07-01', 155912],
    ['2025-10-01', 147017],
  ],
  fmtQ,
  'pct'
);
