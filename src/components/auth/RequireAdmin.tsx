import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isAuthed, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthed) {
    return <Navigate to="/admin-login" replace state={{ from: location }} />;
  }

  return children;
}
