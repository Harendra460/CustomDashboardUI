import { useEffect, useState } from 'react';
import { clock } from '../lib/format.js';

/**
 * The signature element of this console.
 *
 * Every unacknowledged incident carries a live countdown to the moment it
 * escalates to the administrator. The bar drains left-to-right and shifts
 * hi-vis yellow -> amber -> signal red as the deadline approaches, so a
 * supervisor can triage a screenful of incidents by colour alone without
 * reading a single timestamp.
 */
export default function SlaCountdown({ escalatesAt, windowMinutes = 10, compact = false }) {
  const target = new Date(escalatesAt).getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;
  const totalMs = windowMinutes * 60_000;
  const fraction = Math.max(0, Math.min(1, remaining / totalMs));
  const breached = remaining <= 0;

  // Thresholds map to what a supervisor should do, not to arbitrary percentages.
  const tone = breached
    ? { bar: 'bg-signal', text: 'text-signal', note: 'Escalated to admin' }
    : fraction > 0.5
      ? { bar: 'bg-hivis', text: 'text-hivis', note: 'Within window' }
      : fraction > 0.2
        ? { bar: 'bg-[#FF9F45]', text: 'text-[#FF9F45]', note: 'Closing' }
        : { bar: 'bg-signal', text: 'text-signal', note: 'Escalating soon' };

  return (
    <div className={compact ? 'w-24' : 'w-36'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`mono font-semibold tabular-nums ${tone.text}`}>
          {breached ? 'BREACHED' : clock(remaining)}
        </span>
        {!compact && <span className="text-[10px] uppercase tracking-wide text-mist">{tone.note}</span>}
      </div>
      <div
        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-600"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={windowMinutes * 60}
        aria-valuenow={Math.max(0, Math.round(remaining / 1000))}
        aria-label="Time left to acknowledge"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${tone.bar}`}
          style={{ width: `${breached ? 100 : fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
