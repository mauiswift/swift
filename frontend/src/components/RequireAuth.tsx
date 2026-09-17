import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying your session..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
