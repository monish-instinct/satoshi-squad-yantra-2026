import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { AppRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, activeRole, loading, demoMode } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!user && !demoMode) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && activeRole && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
