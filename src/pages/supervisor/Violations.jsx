import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, Filter, RotateCw, Search, X } from 'lucide-react';
import { violationApi } from '../../api/endpoints.js';
import { useSocketEvent } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PPE_LABELS } from '../../lib/constants.js';
import { dateTime, timeAgo, minutes } from '../../lib/format.js';
import { EmptyState, Pagination, SeverityChip, Spinner, StatusChip } from '../../components/Primitives.jsx';
import SlaCountdown from '../../components/SlaCountdown.jsx';
import Modal from '../../components/Modal.jsx';

const STATUS_TABS = [
  { key: 'open', label: 'Awaiting action' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Closed' },
  { key: '', label: 'All' },
];

export default function Violations() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'open', ppeType: '', severity: '', page: 1 });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [ackTarget, setAckTarget] = useState(null); // violation | 'bulk'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (opts = {}) => {
    if (!opts.quiet) setLoading(true);
    try {
      const res = await violationApi.list({ ...filters, limit: 15 });
      setData(res);
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);

  // A new device event should appear without the supervisor refreshing.
  useSocketEvent('violation:new', () => {
    if (filters.status === 'open' || filters.status === '') load({ quiet: true });
  });
  useSocketEvent('violation:escalated', () => load({ quiet: true }));

  const items = data?.items || [];
  const slaWindow = 10;

  const openIds = useMemo(() => items.filter((v) => v.status === 'open').map((v) => v.id), [items]);
  const allOpenSelected = openIds.length > 0 && openIds.every((id) => selected.has(id));

  const toggle = (id) => setSelected((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(allOpenSelected ? new Set() : new Set(openIds));

  const submitAck = async () => {
    setSubmitting(true);
    try {
      if (ackTarget === 'bulk') {
        const { data: res } = await violationApi.bulkAcknowledge([...selected], note);
        toast.success(res.message);
        setSelected(new Set());
      } else {
        const { data: res } = await violationApi.acknowledge(ackTarget.id, note);
        toast.success(res.message);
      }
      setAckTarget(null);
      setNote('');
      load({ quiet: true });
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Site operations</p>
          <h1 className="h-display text-2xl">Violations</h1>
          <p className="mt-1 text-sm text-mist">
            Non-compliance reported by IoT devices across your sites. Acknowledge within{' '}
            <span className="text-hivis">{slaWindow} minutes</span> or it escalates to the administrator.
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => load()}>
          <RotateCw size={14} /> Refresh
        </button>
      </header>

      {/* Status tabs double as the count summary */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const count = tab.key ? data?.statusCounts?.[tab.key] : data?.meta?.total;
          const active = filters.status === tab.key;
          return (
            <button
              key={tab.key || 'all'}
              onClick={() => setFilter({ status: tab.key })}
              className={`chip cursor-pointer px-3 py-1.5 text-xs normal-case tracking-normal ${
                active ? 'border-hivis/50 bg-hivis/10 text-hivis' : 'border-line bg-ink-800 text-mist hover:text-paper'
              }`}
            >
              {tab.label}
              {count !== undefined && <span className="mono opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-head flex-wrap">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist" />
              <input
                className="field pl-8"
                placeholder="Filter by reference"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setFilter({ q: query })}
              />
            </div>
            <select className="field w-auto" value={filters.ppeType} onChange={(e) => setFilter({ ppeType: e.target.value })}>
              <option value="">All PPE types</option>
              {Object.entries(PPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="field w-auto" value={filters.severity} onChange={(e) => setFilter({ severity: e.target.value })}>
              <option value="">Any severity</option>
              {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {selected.size > 0 && (
            <button className="btn-primary btn-sm" onClick={() => setAckTarget('bulk')}>
              <CheckCheck size={14} /> Acknowledge {selected.size}
            </button>
          )}
        </div>

        {loading ? (
          <Spinner label="Loading incidents" />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing in this queue"
            hint="No incidents match these filters. Widen the filters or check another status."
            action={<button className="btn-ghost btn-sm" onClick={() => setFilter({ status: '', ppeType: '', severity: '' })}>
              <Filter size={14} /> Clear filters
            </button>}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-8">
                      {openIds.length > 0 && (
                        <input type="checkbox" checked={allOpenSelected} onChange={toggleAll}
                          className="accent-hivis" aria-label="Select all open incidents" />
                      )}
                    </th>
                    <th>Incident</th>
                    <th>Worker</th>
                    <th>Missing PPE</th>
                    <th>Location</th>
                    <th>SLA</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((v) => (
                    <tr key={v.id} className={v.status === 'escalated' ? 'bg-signal/[0.04]' : undefined}>
                      <td>
                        {v.status === 'open' && (
                          <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)}
                            className="accent-hivis" aria-label={`Select ${v.ref}`} />
                        )}
                      </td>
                      <td>
                        <p className="mono text-hivis/90">{v.ref}</p>
                        <p className="mt-0.5 text-xs text-mist" title={dateTime(v.detectedAt)}>{timeAgo(v.detectedAt)}</p>
                      </td>
                      <td>
                        <p className="text-paper">{v.worker?.name}</p>
                        <p className="mono mt-0.5 text-mist">{v.worker?.workerId} · {v.worker?.department}</p>
                      </td>
                      <td>
                        <p className="text-paper">{PPE_LABELS[v.ppeType] || v.ppeType}</p>
                        <div className="mt-1"><SeverityChip severity={v.severity} /></div>
                      </td>
                      <td>
                        <p className="text-paper">{v.zone}</p>
                        <p className="mono mt-0.5 text-mist">{v.site?.code}</p>
                      </td>
                      <td>
                        {v.status === 'open' ? (
                          <SlaCountdown escalatesAt={v.escalatesAt} windowMinutes={slaWindow} compact />
                        ) : v.responseMinutes != null ? (
                          <span className="mono text-go">{minutes(v.responseMinutes)}</span>
                        ) : (
                          <span className="mono text-mist">—</span>
                        )}
                      </td>
                      <td>
                        <StatusChip status={v.status} />
                        {v.acknowledgedBy && (
                          <p className="mt-1 text-[11px] text-mist">by {v.acknowledgedBy.name}</p>
                        )}
                      </td>
                      <td className="text-right">
                        {['open', 'escalated'].includes(v.status) ? (
                          <button className="btn-primary btn-sm" onClick={() => setAckTarget(v)}>
                            <Check size={13} /> Acknowledge
                          </button>
                        ) : (
                          <span className="text-xs text-mist">No action needed</span>
                        )}
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
        open={Boolean(ackTarget)}
        onClose={() => { setAckTarget(null); setNote(''); }}
        title={ackTarget === 'bulk' ? `Acknowledge ${selected.size} incidents` : `Acknowledge ${ackTarget?.ref || ''}`}
        subtitle="This stops the escalation clock and records you as the responding supervisor."
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setAckTarget(null); setNote(''); }}>Cancel</button>
            <button className="btn-primary" onClick={submitAck} disabled={submitting}>
              {submitting ? 'Acknowledging' : 'Acknowledge'}
            </button>
          </>
        }
      >
        {ackTarget && ackTarget !== 'bulk' && (
          <dl className="mb-4 grid grid-cols-2 gap-3 rounded-md border border-line bg-ink-900 p-3 text-sm">
            <div><dt className="text-xs text-mist">Worker</dt><dd>{ackTarget.worker?.name}</dd></div>
            <div><dt className="text-xs text-mist">Missing</dt><dd>{PPE_LABELS[ackTarget.ppeType]}</dd></div>
            <div><dt className="text-xs text-mist">Zone</dt><dd>{ackTarget.zone}</dd></div>
            <div><dt className="text-xs text-mist">Detected</dt><dd>{dateTime(ackTarget.detectedAt)}</dd></div>
          </dl>
        )}
        <label className="label" htmlFor="ack-note">What action are you taking? (optional)</label>
        <textarea
          id="ack-note" rows={3} maxLength={500} className="field resize-none"
          placeholder="Sent the zone lead to reissue PPE and re-brief the crew."
          value={note} onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </div>
  );
}
