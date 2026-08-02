import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas text-sm text-ink-400">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    const userRole = (user.role || 'user').toLowerCase();
    const requiredRole = allowedRole.toLowerCase();

    if (requiredRole === 'admin' && userRole !== 'admin') {
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return children;
}
