import type { ChangeMode, UnitType } from '../types/indicators';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getArgFormatter(minDecimals: number, maxDecimals: number): Intl.NumberFormat {
  const key = `${minDecimals}-${maxDecimals}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

export function formatArgNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return getArgFormatter(decimals, decimals).format(value);
}

export function formatPrimaryValue(
  value: number,
  unitType: UnitType,
  decimals: number
): { formatted: string; prefix?: string; suffix: string } {
  const formatted = formatArgNumber(value, decimals);
  switch (unitType) {
    case 'ars':
      return { formatted, prefix: '$', suffix: '' };
    case 'usd':
      return { formatted, prefix: 'USD ', suffix: '' };
    case 'usd_m':
      return { formatted, prefix: 'USD ', suffix: ' M' };
    case 'ars_m':
      return { formatted, prefix: '$ ', suffix: ' M' };
    case 'ars_b':
      return { formatted, prefix: '$ ', suffix: ' MM' };
    case 'pct':
      return { formatted, suffix: '%' };
    case 'pts':
      return { formatted, suffix: ' pts' };
    case 'idx':
      return { formatted, suffix: ' pts' };
    default:
      return { formatted, suffix: '' };
  }
}

export function formatCompactValue(
  value: number,
  unitType: UnitType,
  decimals: number
): string {
  const { formatted, prefix, suffix } = formatPrimaryValue(value, unitType, decimals);
  return `${prefix ?? ''}${formatted}${suffix}`.trim();
}

export function formatChange(
  changeValue: number | null,
  mode: ChangeMode
): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (changeValue === null || !Number.isFinite(changeValue)) {
    return { text: 'Sin variación', direction: 'flat' };
  }

  const rounded = Math.abs(changeValue) < 0.005 ? 0 : changeValue;
  const direction: 'up' | 'down' | 'flat' =
    rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  const absStr = formatArgNumber(Math.abs(rounded), mode === 'pts' ? 0 : 2);

  if (mode === 'pp') {
    return { text: `${sign}${absStr} pp`, direction };
  }
  if (mode === 'pts') {
    return { text: `${sign}${absStr} pts`, direction };
  }
  return { text: `${sign}${absStr}%`, direction };
}

const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function formatAxisDate(isoDate: string, mode: 'daily' | 'monthly' | 'quarterly' | 'semiannual' = 'monthly'): string {
  const parts = isoDate.slice(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;

  if (mode === 'daily') {
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  }
  if (mode === 'quarterly') {
    const q = Math.ceil(month / 3);
    return `T${q} '${String(year).slice(-2)}`;
  }
  if (mode === 'semiannual') {
    const s = month <= 6 ? 'S1' : 'S2';
    return `${s} '${String(year).slice(-2)}`;
  }
  return `${MONTHS_SHORT[month - 1] ?? ''} '${String(year).slice(-2)}`;
}

export function formatTooltipDate(isoDate: string, mode: 'daily' | 'monthly' | 'quarterly' | 'semiannual' = 'monthly'): string {
  const parts = isoDate.slice(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;

  if (mode === 'daily') {
    return `${day} ${MONTHS_SHORT[month - 1] ?? ''} ${year}`;
  }
  if (mode === 'quarterly') {
    const q = Math.ceil(month / 3);
    return `${q}° Trimestre ${year}`;
  }
  if (mode === 'semiannual') {
    const s = month <= 6 ? '1° Semestre' : '2° Semestre';
    return `${s} ${year}`;
  }
  const mName = MONTHS_LONG[month - 1] ?? '';
  return `${mName.charAt(0).toUpperCase()}${mName.slice(1)} ${year}`;
}

const BA_TIMEZONE = 'America/Argentina/Buenos_Aires';

export function formatBuenosAiresDateTime(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return 'Actualizado recientemente';

  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = new Map(parts.map((p) => [p.type, p.value]));
  const dd = map.get('day') ?? '';
  const mm = map.get('month') ?? '';
  const yyyy = map.get('year') ?? '';
  const hh = map.get('hour') ?? '';
  const min = map.get('minute') ?? '';

  return `Actualizado: ${dd}/${mm}/${yyyy} · ${hh}:${min} hs`;
}

export function formatBuenosAiresTimeOnly(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: BA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = new Map(parts.map((p) => [p.type, p.value]));
  return `${map.get('hour') ?? '00'}:${map.get('minute') ?? '00'} hs`;
}

export function formatPeriodShort(
  isoDate: string,
  frequencyLabel: string
): string {
  const parts = isoDate.slice(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const lower = frequencyLabel.toLowerCase();

  if (lower.includes('diario')) {
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  if (lower.includes('trim')) {
    const q = Math.ceil(month / 3);
    return `T${q} ${year}`;
  }
  if (lower.includes('semes')) {
    const s = month <= 6 ? 'S1' : 'S2';
    return `${s} ${year}`;
  }
  const mShort = MONTHS_SHORT[month - 1] ?? '';
  return `${mShort.charAt(0).toUpperCase()}${mShort.slice(1)} ${year}`;
}

