import { ArrowUpRight, Clock } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IndicatorData, SeriesPoint } from '../types/indicators';
import {
  formatChange,
  formatCompactValue,
  formatPrimaryValue,
  formatTooltipDate,
} from '../utils/formatters';

interface IndicatorCardProps {
  indicator: IndicatorData;
  onOpenDetail: (indicator: IndicatorData) => void;
}

function getDateMode(frequencyLabel: string): 'daily' | 'monthly' | 'quarterly' | 'semiannual' {
  const lower = frequencyLabel.toLowerCase();
  if (lower.includes('diario')) return 'daily';
  if (lower.includes('trim')) return 'quarterly';
  if (lower.includes('semes')) return 'semiannual';
  return 'monthly';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SeriesPoint }>;
  indicator: IndicatorData;
  dateMode: 'daily' | 'monthly' | 'quarterly' | 'semiannual';
}

function CustomTooltip({ active, payload, indicator, dateMode }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const valStr = formatCompactValue(point.value, indicator.unitType, indicator.decimals);
  const change = formatChange(point.changeValue, indicator.changeMode);

  const changeColorClass =
    change.direction === 'up'
      ? 'text-[#22C55E]'
      : change.direction === 'down'
      ? 'text-[#EF4444]'
      : 'text-[#9CA3AF]';

  const arrow =
    change.direction === 'up' ? '▲ ' : change.direction === 'down' ? '▼ ' : '';

  return (
    <div className="bg-[#0B0E11]/95 border border-[#2C3340] rounded-xl px-3.5 py-2.5 shadow-xl pointer-events-none">
      <p className="text-[11px] font-medium text-[#9CA3AF] mb-1">
        {formatTooltipDate(point.date, dateMode)}
      </p>
      <p className="text-base font-bold text-white font-mono tabular-nums leading-tight">
        {valStr}
      </p>
      <p className={`text-xs font-medium tabular-nums mt-1 ${changeColorClass}`}>
        {arrow}
        {change.text}
      </p>
    </div>
  );
}

export function IndicatorCard({ indicator, onOpenDetail }: IndicatorCardProps) {
  const dateMode = getDateMode(indicator.frequencyLabel);
  const primary = formatPrimaryValue(
    indicator.currentValue,
    indicator.unitType,
    indicator.decimals
  );
  const change = formatChange(indicator.changeValue, indicator.changeMode);
  const minStr = formatCompactValue(
    indicator.minValue,
    indicator.unitType,
    indicator.decimals
  );
  const maxStr = formatCompactValue(
    indicator.maxValue,
    indicator.unitType,
    indicator.decimals
  );

  const changeColor =
    change.direction === 'up'
      ? 'text-[#22C55E]'
      : change.direction === 'down'
      ? 'text-[#EF4444]'
      : 'text-[#9CA3AF]';

  const arrow =
    change.direction === 'up' ? '▲ ' : change.direction === 'down' ? '▼ ' : '';

  const span = indicator.maxValue - indicator.minValue;
  const pad = span > 0 ? span * 0.14 : Math.abs(indicator.currentValue) * 0.05 || 1;
  const yDomain: [number, number] = [
    indicator.minValue - pad,
    indicator.maxValue + pad,
  ];

  const lastIndex = indicator.series.length - 1;
  const gradId = `area-grad-${indicator.id}`;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(indicator)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(indicator);
        }
      }}
      className="group surface-card surface-card-interactive rounded-2xl p-6 flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A24]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-[#9CA3AF] leading-snug truncate group-hover:text-[#D1D5DB] transition-colors">
            {indicator.title}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5 truncate">
            {indicator.subtitle}
          </p>
          <div className="mt-3 flex items-baseline gap-1 font-mono tabular-nums text-[32px] sm:text-[36px] font-bold leading-none text-[#E86A24] tracking-tight">
            {primary.prefix && (
              <span className="text-[22px] sm:text-[24px] font-semibold">
                {primary.prefix.trim()}
              </span>
            )}
            <span>{primary.formatted}</span>
            {primary.suffix && (
              <span className="text-[20px] sm:text-[22px] font-semibold">
                {primary.suffix}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="block text-xs font-medium text-[#9CA3AF]">
            Variación
          </span>
          <span
            className={`block text-sm font-semibold tabular-nums mt-1 ${changeColor}`}
          >
            {arrow}
            {change.text}
          </span>
          <span className="block text-[11px] text-[#6B7280] tabular-nums mt-1.5">
            mín {minStr} · máx {maxStr}
          </span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="mt-5 h-[196px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={indicator.series}
            margin={{ top: 10, right: 8, left: 2, bottom: 0 }}
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
              minTickGap={32}
              dy={6}
            />
            <YAxis domain={yDomain} hide />
            <Tooltip
              content={<CustomTooltip indicator={indicator} dateMode={dateMode} />}
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
                if (props.index !== lastIndex || props.cx == null || props.cy == null) {
                  return <g key={`empty-${props.index}`} />;
                }
                return (
                  <g key={`last-dot-${props.index}`}>
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={8}
                      fill="#E86A24"
                      fillOpacity={0.22}
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
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t surface-divider flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-white group-hover:text-[#E86A24] transition-colors whitespace-nowrap shrink-0">
          Ver detalle histórico
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] tabular-nums ml-auto">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{indicator.updatedAtLabel}</span>
        </span>
      </div>
    </article>
  );
}
