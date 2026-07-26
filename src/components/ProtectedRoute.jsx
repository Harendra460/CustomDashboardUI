import { Navigate, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Primitives.jsx';

/**
 * Route-level access control. The server enforces the same rules on every
 * request — this only keeps the person from landing on a page that would fail.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <div className="grid min-h-screen place-items-center"><Spinner label="Restoring session" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6">
        <div className="panel max-w-md p-8 text-center">
          <ShieldOff size={22} className="mx-auto text-signal" />
          <h1 className="h-display mt-3 text-lg">Not available for your role</h1>
          <p className="mt-2 text-sm text-mist">
            This module is limited to {roles.join(' and ')} accounts. You are signed in as a {user.role}.
          </p>
          <a href={user.role === 'admin' ? '/admin' : '/supervisor'} className="btn-primary mt-5">
            Back to my dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}
