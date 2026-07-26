import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { siteApi, userApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { timeAgo } from '../../lib/format.js';
import { EmptyState, Pagination, Spinner } from '../../components/Primitives.jsx';
import Modal from '../../components/Modal.jsx';

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'supervisor', sites: [] };

export default function Users() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await userApi.list({ q: query || undefined, page, limit: 15 }));
    } catch (err) {
      toast.error(err.uiMessage);
    } finally {
      setLoading(false);
    }
  }, [query, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { siteApi.list().then(setSites).catch(() => {}); }, []);

  const toggleSite = (id) =>
    setForm((f) => ({
      ...f,
      sites: f.sites.includes(id) ? f.sites.filter((s) => s !== id) : [...f.sites, id],
    }));

  const create = async () => {
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await userApi.create(form);
      toast.success(`${user.name} can now sign in`);
      setCreating(false); setForm(EMPTY);
      load();
    } catch (err) {
      if (err.uiDetails) {
        setFieldErrors(Object.fromEntries(err.uiDetails.map((d) => [d.field, d.message])));
      }
      toast.error(err.uiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await userApi.update(user.id, { active: !user.active });
      toast.success(`${user.name} ${user.active ? 'deactivated' : 'reactivated'}`);
      load();
    } catch (err) {
      toast.error(err.uiMessage);
    }
  };

  const resetPassword = async () => {
    try {
      await userApi.resetPassword(resetting.id, newPassword);
      toast.success(`Password reset for ${resetting.name}. They will be signed out everywhere.`);
      setResetting(null); setNewPassword('');
    } catch (err) {
      toast.error(err.uiMessage);
    }
  };

  const users = data?.items || [];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administrator portal</p>
          <h1 className="h-display text-2xl">Users</h1>
          <p className="mt-1 text-sm text-mist">
            Create supervisor accounts and choose which sites each one covers.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <UserPlus size={15} /> Add supervisor
        </button>
      </header>

      <section className="panel">
        <div className="panel-head">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              className="field pl-8" placeholder="Search by name or email"
              value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading accounts" />
        ) : users.length === 0 ? (
          <EmptyState
            title="No accounts match"
            hint="Try a different search, or create the first supervisor for a site."
            action={<button className="btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={13} /> Add supervisor</button>}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th><th>Role</th><th>Sites covered</th><th>Last sign-in</th><th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <p className="text-paper">{u.name}</p>
                        <p className="mt-0.5 text-xs text-mist">{u.email}</p>
                      </td>
                      <td>
                        <span className={`chip ${u.role === 'admin' ? 'border-hivis/40 bg-hivis/10 text-hivis' : 'border-info/40 bg-info/10 text-info'}`}>
                          {u.role === 'admin' && <ShieldCheck size={11} />}
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {u.sites?.length
                            ? u.sites.map((s) => <span key={s._id} className="mono rounded bg-ink-700 px-1.5 py-0.5 text-mist">{s.code}</span>)
                            : <span className="text-xs text-mist">None assigned</span>}
                        </div>
                      </td>
                      <td className="text-xs text-mist">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                      <td>
                        <span className={`chip ${u.active ? 'border-go/40 bg-go/10 text-go' : 'border-line bg-ink-700 text-mist'}`}>
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button className="btn-ghost btn-sm" onClick={() => setResetting(u)}>
                            <KeyRound size={13} /> Reset
                          </button>
                          <button
                            className={u.active ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'}
                            onClick={() => toggleActive(u)}
                          >
                            {u.active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </section>

      {/* Create */}
      <Modal
        open={creating}
        onClose={() => { setCreating(false); setForm(EMPTY); setFieldErrors({}); }}
        title="Add a supervisor"
        subtitle="They will be able to sign in immediately and see only the sites you assign."
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setCreating(false); setForm(EMPTY); }}>Cancel</button>
            <button className="btn-primary" onClick={create} disabled={submitting}>
              {submitting ? 'Creating' : 'Create account'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { key: 'name', label: 'Full name', type: 'text', placeholder: 'Rohit Deshmukh' },
            { key: 'email', label: 'Work email', type: 'email', placeholder: 'rohit@sitesafe.io' },
            { key: 'phone', label: 'Mobile number (optional)', type: 'tel', placeholder: '9820011223' },
            { key: 'password', label: 'Temporary password', type: 'password', placeholder: 'At least 8 characters' },
          ].map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={`u-${f.key}`}>{f.label}</label>
              <input
                id={`u-${f.key}`} type={f.type} className="field" placeholder={f.placeholder}
                value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
              {fieldErrors[f.key] && <p className="mt-1 text-xs text-signal">{fieldErrors[f.key]}</p>}
            </div>
          ))}

          <div>
            <label className="label" htmlFor="u-role">Role</label>
            <select id="u-role" className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="supervisor">Supervisor — monitors and acknowledges violations</option>
              <option value="admin">Administrator — full access including alerts and users</option>
            </select>
          </div>

          <div>
            <span className="label">Sites covered</span>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {sites.map((s) => (
                <label
                  key={s._id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                    form.sites.includes(s._id) ? 'border-hivis/50 bg-hivis/10' : 'border-line bg-ink-900 hover:border-line'
                  }`}
                >
                  <input type="checkbox" className="accent-hivis" checked={form.sites.includes(s._id)} onChange={() => toggleSite(s._id)} />
                  <span className="min-w-0">
                    <span className="mono block text-hivis/80">{s.code}</span>
                    <span className="block truncate text-xs text-mist">{s.name} · {s.headcount} workers</span>
                  </span>
                </label>
              ))}
            </div>
            {fieldErrors.sites && <p className="mt-1 text-xs text-signal">{fieldErrors.sites}</p>}
          </div>
        </div>
      </Modal>

      {/* Reset password */}
      <Modal
        open={Boolean(resetting)}
        onClose={() => { setResetting(null); setNewPassword(''); }}
        title={`Reset password for ${resetting?.name || ''}`}
        subtitle="They will be signed out of every device and must use the new password."
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setResetting(null); setNewPassword(''); }}>Cancel</button>
            <button className="btn-primary" onClick={resetPassword} disabled={newPassword.length < 8}>Reset password</button>
          </>
        }
      >
        <label className="label" htmlFor="new-pass">New password</label>
        <input
          id="new-pass" type="text" className="field" placeholder="At least 8 characters"
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-mist">Share this with them over a channel you trust, then ask them to change it.</p>
      </Modal>
    </div>
  );
}
