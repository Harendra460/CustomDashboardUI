import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { HardHat, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/Primitives.jsx';

const DEMO = [
  { role: 'Administrator', email: 'admin@sitesafe.io', password: 'Admin@12345' },
  { role: 'Supervisor', email: 'rohit.deshmukh@sitesafe.io', password: 'Super@12345' },
];

export default function Login() {
  const { login, user, booting } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (booting) return <div className="grid min-h-screen place-items-center"><Spinner label="Checking session" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/supervisor'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const me = await login(form);
      navigate(me.role === 'admin' ? '/admin' : '/supervisor', { replace: true });
    } catch (err) {
      setError(err.uiMessage || 'Could not sign you in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the thesis. What this console is for, stated plainly. */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-ink-800 p-10 lg:flex">
        <div className="hazard-band absolute inset-x-0 top-0" />
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded bg-hivis text-ink-900"><HardHat size={19} /></div>
          <div>
            <p className="h-display text-base tracking-[0.12em]">SITESAFE</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-mist">PPE Compliance Console</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="eyebrow">The rule this console runs on</p>
          <h1 className="h-display mt-3 text-4xl leading-[1.1]">
            Ten minutes to<br />
            <span className="text-hivis">acknowledge.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            Every helmet, harness and hi-vis vest a device reports as missing opens a clock.
            A supervisor has ten minutes to accept the incident. Miss it, and it lands on the
            administrator's desk automatically.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
            {[
              ['Sites', '4'],
              ['Workers monitored', '100'],
              ['SLA window', '10 min'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-mist">{k}</dt>
                <dd className="h-display mt-1 text-xl text-paper">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-[11px] text-mist">Restricted system. Activity is logged against your account.</p>
      </section>

      {/* Right: the form */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded bg-hivis text-ink-900"><HardHat size={19} /></div>
            <div>
              <p className="h-display text-base tracking-[0.12em]">SITESAFE</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist">PPE Compliance Console</p>
            </div>
          </div>

          <p className="eyebrow">Sign in</p>
          <h2 className="h-display mt-1 text-2xl">Access your portal</h2>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">Work email</label>
              <input
                id="email" type="email" autoComplete="username" required autoFocus
                className="field" placeholder="you@sitesafe.io"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password" type="password" autoComplete="current-password" required
                className="field" placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-signal/40 bg-signal/10 px-3 py-2 text-sm text-signal">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Signing in</> : <><Lock size={15} /> Sign in</>}
            </button>
          </form>

          <div className="mt-8 rounded-md border border-line bg-ink-800 p-3">
            <p className="eyebrow mb-2">Demo accounts</p>
            <ul className="space-y-1.5">
              {DEMO.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    onClick={() => setForm({ email: d.email, password: d.password })}
                    className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-xs hover:bg-ink-700"
                  >
                    <span className="text-paper">{d.role}</span>
                    <span className="mono truncate text-mist">{d.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-2 text-[11px] text-mist">Tap one to fill the form.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
