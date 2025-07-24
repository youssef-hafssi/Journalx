import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminService } from '@/lib/admin';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || authLoading) {
        setIsLoading(false);
        return;
      }

      try {
        const adminStatus = await AdminService.isAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading, user]);

  // Show loading spinner while checking authentication and admin status
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl font-semibold">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This area is restricted to administrators only. If you believe you should have access, 
              please contact your system administrator.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin content if user is admin
  if (isAdmin === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#1a1a1a]">
        {/* Admin header indicator */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>Admin Dashboard - {user?.email}</span>
          </div>
        </div>
        
        {/* Admin content */}
        <main className="relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,255,255,0.03),transparent)]" />
          <div className="relative">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
