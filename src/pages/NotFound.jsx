import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? (user.role === 'admin' ? '/admin' : '/supervisor') : '/login';

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="h-display text-6xl text-hivis">404</p>
        <h1 className="h-display mt-3 text-xl">That page is not part of this console</h1>
        <p className="mt-2 text-sm text-mist">Check the address, or head back to your dashboard.</p>
        <Link to={home} className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  );
}
