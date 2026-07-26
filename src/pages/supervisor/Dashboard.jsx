import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Siren, Timer } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { dashboardApi } from '../../api/endpoints.js';
import { useSocketEvent } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CHART, PPE_LABELS } from '../../lib/constants.js';
import { minutes, timeAgo } from '../../lib/format.js';
import StatCard from '../../components/StatCard.jsx';
import SlaCountdown from '../../components/SlaCountdown.jsx';
import { EmptyState, Panel, SeverityChip, Spinner } from '../../components/Primitives.jsx';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await dashboardApi.supervisor()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketEvent('violation:new', load);
  useSocketEvent('violation:acknowledged', load);
  useSocketEvent('violation:escalated', load);

  if (loading) return <Spinner label="Loading your dashboard" />;

  const k = data.kpis;
  const ppeChart = data.byPpe.map((p) => ({ label: PPE_LABELS[p._id] || p._id, count: p.count }));

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Supervisor portal</p>
        <h1 className="h-display text-2xl">Good to see you, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-mist">
          {k.awaitingAcknowledgement > 0
            ? `${k.awaitingAcknowledgement} incident${k.awaitingAcknowledgement === 1 ? '' : 's'} need your acknowledgement right now.`
            : 'Your queue is clear. Everything reported so far has been acknowledged.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting acknowledgement" value={k.awaitingAcknowledgement}
          tone={k.awaitingAcknowledgement > 0 ? 'warn' : 'good'} icon={Clock}
          hint={`${k.slaWindowMinutes}-minute window`}
        />
        <StatCard
          label="Escalated to admin" value={k.escalated}
          tone={k.escalated > 0 ? 'danger' : 'default'} icon={Siren}
          hint="Missed the SLA"
        />
        <StatCard
          label="Detected today" value={k.detectedToday} icon={AlertTriangle}
          hint="Across your sites"
        />
        <StatCard
          label="Your average response" value={minutes(k.myAvgResponseMinutes)} icon={Timer}
          tone={k.myAvgResponseMinutes && k.myAvgResponseMinutes < 5 ? 'good' : 'default'}
          hint={`${k.myAcknowledgements7d} acknowledged in 7 days`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* The queue, ordered by who runs out of time first. */}
        <Panel
          title="Closest to escalating"
          subtitle="Ordered by time remaining, not by when they arrived"
          action={<Link to="/supervisor/violations" className="btn-ghost btn-sm">Open violations</Link>}
        >
          {data.urgentQueue.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              hint="Nothing is waiting on you. New device events will appear here the moment they arrive."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {data.urgentQueue.map((v) => (
                <li key={v._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-hivis/90">{v.ref}</span>
                      <SeverityChip severity={v.severity} />
                    </div>
                    <p className="mt-1 truncate text-sm text-paper">
                      {v.worker?.name} · {PPE_LABELS[v.ppeType] || v.ppeType}
                    </p>
                    <p className="mt-0.5 text-xs text-mist">
                      {v.site?.code} · {v.zone} · {timeAgo(v.detectedAt)}
                    </p>
                  </div>
                  <SlaCountdown escalatesAt={v.escalatesAt} windowMinutes={k.slaWindowMinutes} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="What is being missed" subtitle="Last 7 days across your sites">
          {ppeChart.length === 0 ? (
            <EmptyState title="No data yet" hint="Charts fill in as devices report events." />
          ) : (
            <div className="p-4 pr-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ppeChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" stroke={CHART.mist} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category" dataKey="label" width={120}
                    stroke={CHART.mist} fontSize={11} tickLine={false} axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#151A21', border: `1px solid ${CHART.line}`, borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Incidents" radius={[0, 3, 3, 0]}>
                    {ppeChart.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? CHART.hivis : CHART.info} fillOpacity={i === 0 ? 1 : 0.55} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="px-2 pt-2 text-xs text-mist">
                <CheckCircle2 size={12} className="mr-1 inline text-go" />
                The top bar is where a toolbox talk would pay off most.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
