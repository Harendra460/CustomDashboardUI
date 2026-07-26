import { useCallback, useEffect, useState } from 'react';
import { CheckCheck, Phone, RotateCw, Siren, UserCheck } from 'lucide-react';
import { alertApi, siteApi, violationApi } from '../../api/endpoints.js';
import { useSocketEvent } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PPE_LABELS } from '../../lib/constants.js';
import { dateTime, plural, timeAgo } from '../../lib/format.js';
import { EmptyState, Pagination, Panel, SeverityChip, Spinner } from '../../components/Primitives.jsx';
import Modal from '../../components/Modal.jsx';

/**
 * Administrator alerts.
 *
 * This page shows one thing only: incidents that no supervisor acknowledged
 * inside the SLA window. Nothing else reaches it. The page is deliberately
 * loud — a hazard band, red references, and an overdue counter — because
 * anything here already represents a missed commitment.
 */
export default function Alerts() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({ site: '', severity: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [responders, setResponders] = useState([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (opts = {}) => {
    if (!opts.quiet) setLoading(true);
    try {
      setData(await alertApi.list({ ...filters, limit: 15 }));
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { siteApi.list().then(setSites).catch(() => {}); }, []);

  useSocketEvent('alert:new', (alerts) => {
    toast.error(`${plural(alerts.length, 'incident')} breached the SLA`);
    load({ quiet: true });
  });
  useSocketEvent('alert:cleared', () => load({ quiet: true }));

  const openAlert = async (alert) => {
    setTarget(alert);
    setResponders([]);
    try { setResponders(await alertApi.responders(alert.id)); } catch { /* non-critical */ }
  };

  const closeOut = async () => {
    if (note.trim().length < 3) { toast.error('Say what action was taken before closing'); return; }
    setSubmitting(true);
    try {
      const { data: res } = await violationApi.resolve(target.id, note);
      toast.success(res.message);
      setTarget(null); setNote('');
      load({ quiet: true });
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const items = data?.items || [];
  const counts = data?.severityCounts || {};

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administrator portal</p>
          <h1 className="h-display text-2xl">Alerts</h1>
          <p className="mt-1 text-sm text-mist">
            Incidents no supervisor acknowledged within{' '}
            <span className="text-hivis">{data?.slaWindowMinutes ?? 10} minutes</span> of detection.
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => load()}><RotateCw size={14} /> Refresh</button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <select className="field w-auto" value={filters.site}
          onChange={(e) => setFilters({ ...filters, site: e.target.value, page: 1 })}>
          <option value="">All sites</option>
          {sites.map((s) => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
        </select>
        <select className="field w-auto" value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}>
          <option value="">Any severity</option>
          {['critical', 'high', 'medium', 'low'].map((s) => (
            <option key={s} value={s}>{s}{counts[s] ? ` (${counts[s]})` : ''}</option>
          ))}
        </select>
      </div>

      <section className="panel overflow-hidden">
        {/* The only place hazard stripes appear in this product. */}
        <div className="hazard-band" aria-hidden />
        <div className="panel-head">
          <div className="flex items-center gap-2">
            <Siren size={16} className={items.length ? 'text-signal' : 'text-mist'} />
            <h2 className="h-display text-sm">
              {data?.meta?.total ? `${plural(data.meta.total, 'unacknowledged alert')}` : 'Unacknowledged alerts'}
            </h2>
          </div>
        </div>

        {loading ? (
          <Spinner label="Checking for escalations" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No alerts. Supervisors are keeping up."
            hint="An incident only appears here after ten minutes without acknowledgement. An empty page means the SLA is holding."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Worker</th>
                    <th>Missing PPE</th>
                    <th>Site &amp; zone</th>
                    <th>Overdue by</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <p className="mono text-signal">{v.ref}</p>
                        <p className="mt-0.5 text-xs text-mist" title={dateTime(v.detectedAt)}>
                          detected {timeAgo(v.detectedAt)}
                        </p>
                      </td>
                      <td>
                        <p className="text-paper">{v.worker?.name}</p>
                        <p className="mono mt-0.5 text-mist">{v.worker?.workerId} · {v.worker?.jobProfile}</p>
                      </td>
                      <td>
                        <p className="text-paper">{PPE_LABELS[v.ppeType] || v.ppeType}</p>
                        <div className="mt-1"><SeverityChip severity={v.severity} /></div>
                      </td>
                      <td>
                        <p className="text-paper">{v.site?.name}</p>
                        <p className="mono mt-0.5 text-mist">{v.site?.code} · {v.zone}</p>
                      </td>
                      <td>
                        <span className="mono rounded border border-signal/40 bg-signal/10 px-2 py-1 text-signal">
                          +{v.overdueMinutes}m
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn-ghost btn-sm" onClick={() => openAlert(v)}>
                          <UserCheck size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </section>

      <Modal
        open={Boolean(target)}
        onClose={() => { setTarget(null); setNote(''); }}
        title={target ? `Review ${target.ref}` : ''}
        subtitle="Close this out once action has been taken on the ground."
        width="max-w-xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setTarget(null); setNote(''); }}>Cancel</button>
            <button className="btn-primary" onClick={closeOut} disabled={submitting}>
              <CheckCheck size={14} /> {submitting ? 'Closing' : 'Close incident'}
            </button>
          </>
        }
      >
        {target && (
          <>
            <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-ink-900 p-3 text-sm">
              <div><dt className="text-xs text-mist">Worker</dt><dd>{target.worker?.name} ({target.worker?.workerId})</dd></div>
              <div><dt className="text-xs text-mist">Department</dt><dd>{target.worker?.department}</dd></div>
              <div><dt className="text-xs text-mist">Missing PPE</dt><dd>{PPE_LABELS[target.ppeType]}</dd></div>
              <div><dt className="text-xs text-mist">Severity</dt><dd className="capitalize">{target.severity}</dd></div>
              <div><dt className="text-xs text-mist">Detected</dt><dd>{dateTime(target.detectedAt)}</dd></div>
              <div><dt className="text-xs text-mist">SLA expired</dt><dd className="text-signal">{dateTime(target.escalatesAt)}</dd></div>
              <div><dt className="text-xs text-mist">Zone</dt><dd>{target.zone}</dd></div>
              <div><dt className="text-xs text-mist">Device</dt><dd className="mono">{target.deviceId}</dd></div>
            </dl>

            <div className="mt-4">
              <p className="eyebrow mb-2">Supervisors covering this site</p>
              {responders.length === 0 ? (
                <p className="text-xs text-mist">No active supervisor is assigned to this site — that is likely the cause.</p>
              ) : (
                <ul className="space-y-1.5">
                  {responders.map((r) => (
                    <li key={r._id} className="flex items-center justify-between gap-3 rounded border border-line bg-ink-900 px-3 py-2 text-sm">
                      <div>
                        <p className="text-paper">{r.name}</p>
                        <p className="text-xs text-mist">Last signed in {r.lastLoginAt ? timeAgo(r.lastLoginAt) : 'never'}</p>
                      </div>
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="btn-ghost btn-sm"><Phone size={13} /> {r.phone}</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="resolve-note">What action was taken?</label>
              <textarea
                id="resolve-note" rows={3} maxLength={500} className="field resize-none"
                placeholder="Called the site lead, PPE reissued and the worker re-inducted before returning to the zone."
                value={note} onChange={(e) => setNote(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-mist">Recorded against the incident for the audit trail.</p>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
