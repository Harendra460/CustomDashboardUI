import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Siren, BarChart3, ShieldAlert, FileDown,
  HardHat, Menu, X, LogOut, Radio, RadioTower,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { initials } from '../lib/format.js';

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/alerts', label: 'Alerts', icon: Siren },
  { to: '/admin/insights', label: 'Data insights', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/workforce', label: 'Workforce', icon: HardHat },
];

const SUPERVISOR_NAV = [
  { to: '/supervisor', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/supervisor/violations', label: 'Violations', icon: ShieldAlert },
  { to: '/supervisor/reports', label: 'Reports', icon: FileDown },
  { to: '/supervisor/workforce', label: 'Workforce', icon: HardHat },
];

export default function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const nav = isAdmin ? ADMIN_NAV : SUPERVISOR_NAV;
  const sites = user?.sites || [];

  const handleSignOut = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-ink-800 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded bg-hivis text-ink-900">
            <HardHat size={17} />
          </div>
          <div>
            <p className="h-display text-sm leading-tight tracking-[0.1em] text-paper">SITESAFE</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-mist">PPE Compliance</p>
          </div>
          <button className="ml-auto text-mist lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="eyebrow px-2 pb-1.5 pt-2">{isAdmin ? 'Administration' : 'Site operations'}</p>
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-hivis/10 font-medium text-hivis ring-1 ring-inset ring-hivis/25'
                    : 'text-mist hover:bg-ink-700 hover:text-paper'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {sites.length > 0 && (
            <div className="pt-5">
              <p className="eyebrow px-2 pb-1.5">{isAdmin ? 'All sites' : 'My sites'}</p>
              <ul className="space-y-1 px-2">
                {sites.map((s) => (
                  <li key={s._id || s.id} className="flex items-baseline gap-2 text-xs text-mist">
                    <span className="mono text-hivis/70">{s.code}</span>
                    <span className="truncate">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-ink-700 text-xs font-semibold">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-paper">{user?.name}</p>
              <p className="text-[11px] capitalize text-mist">{user?.role}</p>
            </div>
            <button onClick={handleSignOut} className="text-mist hover:text-signal" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 z-30 bg-ink-900/70 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-ink-900/85 px-4 py-3 backdrop-blur lg:px-6">
          <button className="text-mist lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">{isAdmin ? 'Administrator portal' : 'Supervisor portal'}</p>
          </div>

          {/* Live device feed status — matters on a monitoring screen. */}
          <span
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-medium uppercase tracking-wide ${
              connected ? 'border-go/40 bg-go/10 text-go' : 'border-line bg-ink-700 text-mist'
            }`}
            title={connected ? 'Receiving live device events' : 'Not connected to the device feed'}
          >
            {connected ? <RadioTower size={12} /> : <Radio size={12} />}
            {connected ? 'Live' : 'Offline'}
          </span>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
