import { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { reportApi, siteApi } from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PPE_LABELS } from '../../lib/constants.js';
import { Panel, Spinner } from '../../components/Primitives.jsx';

const RANGES = [
  { key: '1', label: 'Today' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '', label: 'All time' },
];

const rangeToDates = (days) => {
  if (!days) return {};
  const from = new Date();
  from.setDate(from.getDate() - (Number(days) - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString() };
};

export default function Reports() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [sites, setSites] = useState([]);
  const [range, setRange] = useState('7');
  const [filters, setFilters] = useState({ status: '', ppeType: '', severity: '', site: '' });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const params = { ...filters, ...rangeToDates(range) };

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      setPreview(await reportApi.preview(params));
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPreview(); }, [loadPreview]);
  useEffect(() => { siteApi.list().then(setSites).catch(() => {}); }, []);

  const download = async () => {
    setDownloading(true);
    try {
      const rows = await reportApi.downloadCSV({ ...params, limit: 20000 });
      toast.success(`Exported ${rows} rows`);
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setDownloading(false);
    }
  };

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">Site operations</p>
        <h1 className="h-display text-2xl">Reports</h1>
        <p className="mt-1 text-sm text-mist">
          Build a violations extract and download it as CSV. Only sites you cover are included.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel title="Build the extract" subtitle="Every filter narrows the rows in the file">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="label">Date range</span>
              <div className="flex flex-wrap gap-1.5">
                {RANGES.map((r) => (
                  <button
                    key={r.key || 'all'}
                    onClick={() => setRange(r.key)}
                    className={`chip cursor-pointer px-3 py-1.5 text-xs normal-case tracking-normal ${
                      range === r.key
                        ? 'border-hivis/50 bg-hivis/10 text-hivis'
                        : 'border-line bg-ink-800 text-mist hover:text-paper'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="r-status">Status</label>
              <select id="r-status" className="field" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
                <option value="">Every status</option>
                <option value="open">Awaiting action</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Closed</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="r-ppe">Missing PPE</label>
              <select id="r-ppe" className="field" value={filters.ppeType} onChange={(e) => set({ ppeType: e.target.value })}>
                <option value="">Every type</option>
                {Object.entries(PPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="r-sev">Severity</label>
              <select id="r-sev" className="field" value={filters.severity} onChange={(e) => set({ severity: e.target.value })}>
                <option value="">Any severity</option>
                {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="label" htmlFor="r-site">Site</label>
                <select id="r-site" className="field" value={filters.site} onChange={(e) => set({ site: e.target.value })}>
                  <option value="">All sites</option>
                  {sites.map((s) => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Ready to export">
            <div className="p-4">
              {loading ? (
                <Spinner label="Counting rows" />
              ) : (
                <>
                  <p className="stat text-hivis">{preview?.total ?? 0}</p>
                  <p className="mt-1 text-xs text-mist">rows match these filters</p>

                  {preview?.total > 0 && (
                    <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
                      {Object.entries(preview.breakdown).map(([status, count]) => (
                        <li key={status} className="flex justify-between text-xs">
                          <span className="capitalize text-mist">{status}</span>
                          <span className="mono text-paper">{count}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    className="btn-primary mt-5 w-full"
                    onClick={download}
                    disabled={downloading || !preview?.total}
                  >
                    {downloading
                      ? <><Loader2 size={15} className="animate-spin" /> Preparing file</>
                      : <><Download size={15} /> Download CSV</>}
                  </button>
                  {!preview?.total && (
                    <p className="mt-2 text-center text-xs text-mist">Widen the filters to enable the download.</p>
                  )}
                </>
              )}
            </div>
          </Panel>

          <Panel title="Columns in the file">
            <div className="max-h-64 overflow-y-auto p-4">
              <ul className="space-y-1">
                {(preview?.columns || []).map((c) => (
                  <li key={c} className="flex items-center gap-2 text-xs text-mist">
                    <FileSpreadsheet size={12} className="shrink-0 text-hivis/60" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
