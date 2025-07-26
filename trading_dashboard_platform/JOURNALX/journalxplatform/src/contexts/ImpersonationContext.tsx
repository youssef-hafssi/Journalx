import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdminService } from '@/lib/admin';
import type { AdminUser } from '@/types/admin';

interface ImpersonationContextType {
  impersonatedUser: AdminUser | null;
  isImpersonating: boolean;
  startImpersonation: (user: AdminUser) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUser, setImpersonatedUser] = useState<AdminUser | null>(null);

  const startImpersonation = (user: AdminUser) => {
    console.log('🎭 Starting impersonation of user:', user.email);
    setImpersonatedUser(user);
  };

  const stopImpersonation = () => {
    console.log('🎭 Stopping impersonation');
    setImpersonatedUser(null);
  };

  const value: ImpersonationContextType = {
    impersonatedUser,
    isImpersonating: !!impersonatedUser,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
