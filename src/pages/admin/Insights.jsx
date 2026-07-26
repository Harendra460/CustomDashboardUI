import { useCallback, useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { insightApi } from '../../api/endpoints.js';
import { CHART } from '../../lib/constants.js';
import { dayLabel } from '../../lib/format.js';
import { EmptyState, Panel, Spinner } from '../../components/Primitives.jsx';

const RANGES = [7, 14, 30, 60];

const axis = { stroke: CHART.mist, fontSize: 11, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: { background: '#151A21', border: `1px solid ${CHART.line}`, borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E8EDF3' },
};

export default function Insights() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await insightApi.get({ days })); } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <Spinner label="Crunching the numbers" />;
  if (!data) return <EmptyState title="No data available" hint="Seed the database to populate the charts." />;

  const trend = data.trend.map((t) => ({ ...t, label: dayLabel(t.date) }));
  const peakHour = data.byHour.reduce((a, b) => (b.count > a.count ? b : a), data.byHour[0]);
  const totalIncidents = data.trend.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administrator portal</p>
          <h1 className="h-display text-2xl">Data insights</h1>
          <p className="mt-1 text-sm text-mist">
            {totalIncidents} incidents over the last {data.rangeDays} days.
            Peak reporting hour is {String(peakHour.hour).padStart(2, '0')}:00.
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`chip cursor-pointer px-3 py-1.5 text-xs normal-case tracking-normal ${
                days === d ? 'border-hivis/50 bg-hivis/10 text-hivis' : 'border-line bg-ink-800 text-mist hover:text-paper'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </header>

      {/* Headline time series */}
      <Panel title="Daily volume and outcome" subtitle="Total detections against how many escalated past the SLA">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.hivis} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.hivis} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEsc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.signal} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART.signal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: CHART.mist }} />
              <Area type="monotone" dataKey="total" name="Detected" stroke={CHART.hivis} strokeWidth={2} fill="url(#gTotal)" />
              <Area type="monotone" dataKey="escalated" name="Escalated" stroke={CHART.signal} strokeWidth={2} fill="url(#gEsc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Most-missed equipment" subtitle="With the share that escalated">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byPpe} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="label" width={110} {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Detected" fill={CHART.hivis} radius={[0, 3, 3, 0]} />
                <Bar dataKey="escalated" name="Escalated" fill={CHART.signal} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="When incidents happen" subtitle="By hour of day — drives patrol scheduling">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byHour} margin={{ left: -12, right: 8 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" {...axis} tickFormatter={(h) => `${String(h).padStart(2, '0')}`} interval={2} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} labelFormatter={(h) => `${String(h).padStart(2, '0')}:00`} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Incidents" radius={[3, 3, 0, 0]}>
                  {data.byHour.map((h) => (
                    <Cell key={h.hour} fill={h.hour === peakHour.hour ? CHART.hivis : CHART.info} fillOpacity={h.hour === peakHour.hour ? 1 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Site compliance" subtitle="Share of incidents acknowledged inside the SLA">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.bySite} margin={{ left: -12, right: 8 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="code" {...axis} />
                <YAxis {...axis} domain={[0, 100]} unit="%" />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone" dataKey="complianceRate" name="Compliance %"
                  stroke={CHART.go} strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART.go }} activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {data.bySite.map((s) => (
                <li key={s.code} className="flex items-center justify-between rounded border border-line bg-ink-900 px-3 py-2 text-xs">
                  <span className="truncate text-mist">{s.site}</span>
                  <span className="mono text-paper">{s.count} · avg {s.avgResponse}m</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Response time distribution" subtitle="How fast supervisors acknowledge">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.responseBuckets} margin={{ left: -12, right: 8 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Incidents" radius={[3, 3, 0, 0]}>
                  {data.responseBuckets.map((b, i) => (
                    <Cell key={i} fill={b.breach ? CHART.signal : CHART.go} fillOpacity={b.breach ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-mist">Green bars stayed inside the SLA. Red missed it.</p>
          </div>
        </Panel>

        <Panel title="Incidents by department" subtitle="Where the exposure sits">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data.byDepartment.slice(0, 8)} outerRadius="72%">
                <PolarGrid stroke={CHART.line} />
                <PolarAngleAxis dataKey="department" tick={{ fill: CHART.mist, fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Radar name="Incidents" dataKey="count" stroke={CHART.hivis} fill={CHART.hivis} fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Current status mix" subtitle="Where every incident in the window stands">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusMix} dataKey="count" nameKey="status"
                  innerRadius="52%" outerRadius="78%" paddingAngle={3} stroke="none"
                >
                  {data.statusMix.map((s, i) => (
                    <Cell
                      key={s.status}
                      fill={{ open: CHART.hivis, acknowledged: CHART.go, escalated: CHART.signal, resolved: CHART.mist }[s.status] || CHART.series[i]}
                    />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Repeat offenders" subtitle="Workers with the most incidents in this window — candidates for retraining">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>#</th><th>Worker</th><th>Job profile</th><th>Department</th><th>Incidents</th><th>Distinct PPE types</th></tr>
            </thead>
            <tbody>
              {data.repeatOffenders.map((w, i) => (
                <tr key={w.workerId}>
                  <td className="mono text-mist">{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <p className="text-paper">{w.name}</p>
                    <p className="mono mt-0.5 text-mist">{w.workerId}</p>
                  </td>
                  <td className="text-mist">{w.jobProfile}</td>
                  <td className="text-mist">{w.department}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="h-display text-base text-hivis">{w.count}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink-600">
                        <div className="h-full bg-hivis" style={{ width: `${(w.count / data.repeatOffenders[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="mono text-mist">{w.distinctTypes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
