import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { AdminService } from '@/lib/admin';
import { Loader2 } from 'lucide-react';

interface ImpersonatedRouteProps {
  children: React.ReactNode;
}

export function ImpersonatedRoute({ children }: ImpersonatedRouteProps) {
  const { userId } = useParams<{ userId: string }>();
  const { impersonatedUser, isImpersonating } = useImpersonation();

  // If not impersonating or no user ID, redirect to admin
  if (!isImpersonating || !userId) {
    return <Navigate to="/admin/users" replace />;
  }

  // If impersonating but user ID doesn't match, redirect to correct user
  if (impersonatedUser && impersonatedUser.id !== userId) {
    return <Navigate to={`/admin/impersonate/${impersonatedUser.id}/dashboard`} replace />;
  }

  // If no impersonated user data, show loading
  if (!impersonatedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading impersonated user...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
