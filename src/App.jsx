import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Workforce from './pages/Workforce.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminAlerts from './pages/admin/Alerts.jsx';
import AdminInsights from './pages/admin/Insights.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import SupervisorDashboard from './pages/supervisor/Dashboard.jsx';
import SupervisorViolations from './pages/supervisor/Violations.jsx';
import SupervisorReports from './pages/supervisor/Reports.jsx';

/** Sends a signed-in person to the portal their role belongs to. */
function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/supervisor'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleHome />} />

      {/* Administrator portal */}
      <Route
        path="/admin"
        element={<ProtectedRoute roles={['admin']}><AppShell /></ProtectedRoute>}
      >
        <Route index element={<AdminDashboard />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="insights" element={<AdminInsights />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="workforce" element={<Workforce />} />
      </Route>

      {/* Supervisor portal */}
      <Route
        path="/supervisor"
        element={<ProtectedRoute roles={['supervisor', 'admin']}><AppShell /></ProtectedRoute>}
      >
        <Route index element={<SupervisorDashboard />} />
        <Route path="violations" element={<SupervisorViolations />} />
        <Route path="reports" element={<SupervisorReports />} />
        <Route path="workforce" element={<Workforce />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
