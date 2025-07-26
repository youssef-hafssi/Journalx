import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { AdminService } from '@/lib/admin';

export function useImpersonatedTrades() {
  const { userId } = useParams<{ userId: string }>();
  const { isImpersonating } = useImpersonation();
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrades = async () => {
      if (!userId || !isImpersonating) {
        setTrades([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('🎭 Loading trades for impersonated user:', userId);
        
        const userTrades = await AdminService.getUserTrades(userId);
        console.log('🎭 Loaded trades:', userTrades.length);
        
        setTrades(userTrades);
      } catch (err) {
        console.error('Error loading impersonated user trades:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trades');
        setTrades([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrades();
  }, [userId, isImpersonating]);

  return {
    trades,
    isLoading,
    error,
    userId
  };
}
