import { useCallback, useEffect, useState } from 'react';
import { HardHat, Search, SlidersHorizontal } from 'lucide-react';
import { workerApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import { PPE_LABELS } from '../lib/constants.js';
import { dateTime, timeAgo } from '../lib/format.js';
import { EmptyState, Pagination, Spinner, StatusChip } from '../components/Primitives.jsx';
import Modal from '../components/Modal.jsx';

/**
 * The imported roster from workers_dataset.xlsx, joined with each worker's
 * live incident history. Available to both roles; a supervisor only sees the
 * workers on the sites they cover (enforced server-side).
 */
export default function Workforce() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ departments: [], jobProfiles: [] });
  const [filters, setFilters] = useState({ q: '', department: '', jobProfile: '', sort: 'workerId', page: 1 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await workerApi.list({ ...filters, limit: 15 }));
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { workerApi.filters().then(setOptions).catch(() => {}); }, []);

  const openDetail = async (id) => {
    try { setDetail(await workerApi.get(id)); } catch (err) { toast.error(err.uiMessage); }
  };

  const set = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const workers = data?.items || [];

  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Roster</p>
        <h1 className="h-display text-2xl">Workforce</h1>
        <p className="mt-1 text-sm text-mist">
          Every monitored worker, their assigned IoT device, and their compliance record.
        </p>
      </header>

      <section className="panel">
        <div className="panel-head flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              className="field pl-8" placeholder="Search name, worker ID or trade"
              value={filters.q} onChange={(e) => set({ q: e.target.value })}
            />
          </div>
          <select className="field w-auto" value={filters.department} onChange={(e) => set({ department: e.target.value })}>
            <option value="">All departments</option>
            {options.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="field w-auto" value={filters.jobProfile} onChange={(e) => set({ jobProfile: e.target.value })}>
            <option value="">All job profiles</option>
            {options.jobProfiles.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          <select className="field w-auto" value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="workerId">Sort by ID</option>
            <option value="name">Sort by name</option>
            <option value="violations">Most incidents</option>
            <option value="recent">Most recent incident</option>
          </select>
        </div>

        {loading ? (
          <Spinner label="Loading roster" />
        ) : workers.length === 0 ? (
          <EmptyState
            title="No workers match"
            hint="Clear the filters, or check that the dataset has been seeded."
            action={<button className="btn-ghost btn-sm" onClick={() => set({ q: '', department: '', jobProfile: '' })}>
              <SlidersHorizontal size={13} /> Clear filters
            </button>}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Worker</th><th>Trade</th><th>Department</th><th>Site &amp; shift</th>
                    <th>Device</th><th>Incidents</th><th className="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w._id}>
                      <td>
                        <p className="text-paper">{w.name}</p>
                        <p className="mono mt-0.5 text-hivis/70">{w.workerId}</p>
                      </td>
                      <td className="text-mist">{w.jobProfile}</td>
                      <td className="text-mist">{w.department}</td>
                      <td>
                        <p className="mono text-mist">{w.site?.code}</p>
                        <p className="mt-0.5 text-xs text-mist">Shift {w.shift}</p>
                      </td>
                      <td>
                        <p className="mono text-mist">{w.deviceId}</p>
                        <span className={`chip mt-1 ${w.deviceStatus === 'online' ? 'border-go/40 bg-go/10 text-go' : 'border-line bg-ink-700 text-mist'}`}>
                          {w.deviceStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`h-display text-base ${w.violationCount > 8 ? 'text-signal' : w.violationCount > 3 ? 'text-hivis' : 'text-paper'}`}>
                          {w.violationCount}
                        </span>
                        {w.lastViolationAt && <p className="mt-0.5 text-xs text-mist">{timeAgo(w.lastViolationAt)}</p>}
                      </td>
                      <td className="text-right">
                        <button className="btn-ghost btn-sm" onClick={() => openDetail(w._id)}>View record</button>
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
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name}
        subtitle={detail ? `${detail.workerId} · ${detail.jobProfile}` : ''}
        width="max-w-2xl"
      >
        {detail && (
          <>
            <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-ink-900 p-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-mist">Department</dt><dd>{detail.department}</dd></div>
              <div><dt className="text-xs text-mist">Site</dt><dd>{detail.site?.name}</dd></div>
              <div><dt className="text-xs text-mist">Shift</dt><dd>{detail.shift}</dd></div>
              <div><dt className="text-xs text-mist">Mobile</dt><dd className="mono">{detail.mobileMasked}</dd></div>
              <div><dt className="text-xs text-mist">Aadhaar</dt><dd className="mono">•••• •••• {detail.aadhaarLast4}</dd></div>
              <div><dt className="text-xs text-mist">Device</dt><dd className="mono">{detail.deviceId}</dd></div>
            </dl>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-mist">
              <HardHat size={11} /> Identity numbers are stored hashed. Only the last four digits are readable.
            </p>

            <h3 className="eyebrow mt-5 mb-2">Recent incidents</h3>
            {detail.history.length === 0 ? (
              <p className="rounded border border-line bg-ink-900 px-3 py-4 text-center text-sm text-mist">
                Clean record. No non-compliance reported for this worker.
              </p>
            ) : (
              <ul className="divide-y divide-line/60 rounded border border-line">
                {detail.history.map((h) => (
                  <li key={h._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <div>
                      <span className="mono text-mist">{h.ref}</span>
                      <p className="mt-0.5">{PPE_LABELS[h.ppeType] || h.ppeType} · <span className="text-mist">{h.zone}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-mist">{dateTime(h.detectedAt)}</span>
                      <StatusChip status={h.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
