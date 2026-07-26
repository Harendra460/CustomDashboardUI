import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, HardHat, ShieldCheck, Siren, Timer, UserCog } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints.js';
import { useSocketEvent } from '../../context/SocketContext.jsx';
import { PPE_LABELS } from '../../lib/constants.js';
import { minutes, timeAgo } from '../../lib/format.js';
import StatCard from '../../components/StatCard.jsx';
import { EmptyState, Panel, SeverityChip, Spinner } from '../../components/Primitives.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await dashboardApi.admin()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent('alert:new', load);
  useSocketEvent('alert:cleared', load);

  if (loading) return <Spinner label="Loading dashboard" />;
  const k = data.kpis;

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Administrator portal</p>
        <h1 className="h-display text-2xl">Programme overview</h1>
        <p className="mt-1 text-sm text-mist">
          Compliance across all sites, measured against the {k.slaWindowMinutes}-minute acknowledgement rule.
        </p>
      </header>

      {/* Row 1: the numbers that decide whether anyone needs to act today. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unacknowledged alerts" value={k.pendingAlerts} icon={Siren}
          tone={k.pendingAlerts > 0 ? 'danger' : 'good'}
          hint="Past the SLA window"
        />
        <StatCard
          label="Violations today" value={k.violationsToday} icon={ShieldCheck}
          trendPct={k.violationsTrendPct} invertTrend
          hint="vs yesterday"
        />
        <StatCard
          label="SLA compliance" value={k.slaComplianceRate} unit="%" icon={Timer}
          tone={k.slaComplianceRate >= 90 ? 'good' : k.slaComplianceRate >= 75 ? 'warn' : 'danger'}
          hint="Acknowledged in time, 7 days"
        />
        <StatCard
          label="Average response" value={minutes(k.avgResponseMinutes)} icon={Timer}
          hint="Detection to acknowledgement"
        />
      </div>

      {/* Row 2: the standing shape of the operation. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Workers monitored" value={k.totalWorkers} icon={HardHat} hint="Active on the roster" />
        <StatCard label="Client sites" value={k.activeSites} icon={Building2} hint="Currently operating" />
        <StatCard label="Supervisors" value={k.supervisors} icon={UserCog} hint="Active accounts" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Sites by incident volume"
          subtitle="Last 7 days"
          action={<Link to="/admin/insights" className="btn-ghost btn-sm">Full insights</Link>}
        >
          {data.topSites.length === 0 ? (
            <EmptyState title="No incidents recorded" hint="Site rankings appear once devices start reporting." />
          ) : (
            <ul className="divide-y divide-line/60">
              {data.topSites.map((s) => {
                const worst = data.topSites[0].total || 1;
                return (
                  <li key={s.code} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-paper">{s.site}</p>
                        <p className="mono mt-0.5 text-mist">{s.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="h-display text-lg">{s.total}</p>
                        {s.escalated > 0 && <p className="text-[11px] text-signal">{s.escalated} escalated</p>}
                      </div>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-600">
                      <div className="h-full rounded-full bg-hivis" style={{ width: `${(s.total / worst) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest escalations"
          subtitle="Nobody acknowledged these in time"
          action={<Link to="/admin/alerts" className="btn-ghost btn-sm">All alerts</Link>}
        >
          {data.recentEscalations.length === 0 ? (
            <EmptyState
              title="No open escalations"
              hint="Supervisors are clearing incidents inside the SLA window. Nothing needs your attention."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {data.recentEscalations.map((v) => (
                <li key={v._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="mono text-signal">{v.ref}</span>
                      <SeverityChip severity={v.severity} />
                    </div>
                    <p className="mt-1 truncate text-sm text-paper">
                      {v.worker?.name} · {PPE_LABELS[v.ppeType] || v.ppeType}
                    </p>
                    <p className="mt-0.5 text-xs text-mist">
                      {v.site?.code} · escalated {timeAgo(v.escalatedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
