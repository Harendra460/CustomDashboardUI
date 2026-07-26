import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/**
 * One number, one label, one qualifier. The trend arrow is only rendered when
 * a comparison actually exists — no placeholder deltas.
 */
export default function StatCard({ label, value, unit, hint, trendPct, invertTrend = false, tone = 'default', icon: Icon }) {
  const toneRing = {
    default: 'border-line',
    warn: 'border-hivis/40',
    danger: 'border-signal/50',
    good: 'border-go/40',
  }[tone];

  const toneText = {
    default: 'text-paper',
    warn: 'text-hivis',
    danger: 'text-signal',
    good: 'text-go',
  }[tone];

  const hasTrend = typeof trendPct === 'number' && Number.isFinite(trendPct);
  // For violation counts, "up" is bad. invertTrend flips the colour meaning.
  const rising = hasTrend && trendPct > 0;
  const flat = hasTrend && Math.abs(trendPct) < 0.5;
  const TrendIcon = flat ? Minus : rising ? ArrowUpRight : ArrowDownRight;
  const trendGood = invertTrend ? !rising : rising;

  return (
    <div className={`panel border ${toneRing} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon size={16} className="shrink-0 text-mist" />}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`stat ${toneText}`}>{value ?? '—'}</span>
        {unit && <span className="text-sm text-mist">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {hasTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              flat ? 'text-mist' : trendGood ? 'text-go' : 'text-signal'
            }`}
          >
            <TrendIcon size={13} />
            {Math.abs(trendPct)}%
          </span>
        )}
        {hint && <span className="text-xs text-mist">{hint}</span>}
      </div>
    </div>
  );
}
