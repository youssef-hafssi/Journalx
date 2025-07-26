import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const { impersonatedUser, isImpersonating, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  const handleStopImpersonation = () => {
    stopImpersonation();
    toast.success('Stopped impersonation');
    navigate('/admin/users');
  };

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
      <UserCheck className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-orange-800 dark:text-orange-200">
            Admin Impersonation Active
          </span>
          <span className="text-orange-700 dark:text-orange-300">
            Viewing as: <strong>{impersonatedUser.name}</strong> ({impersonatedUser.email})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="h-7 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Admin
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopImpersonation}
            className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <X className="h-3 w-3 mr-1" />
            Stop Impersonation
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
