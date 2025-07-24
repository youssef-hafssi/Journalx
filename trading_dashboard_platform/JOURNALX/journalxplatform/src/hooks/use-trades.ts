import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tradesService } from '@/lib/trades';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { toast } from 'sonner';

// Custom event to notify when trades are deleted so journal entries can refresh
const TRADE_DELETED_EVENT = 'tradeDeleted';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Load trades when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTrades();
    } else {
      setTrades([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadTrades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTrades = await tradesService.getTrades();
      setTrades(fetchedTrades);
    } catch (err) {
      console.error('Error loading trades:', err);
      setError('Failed to load trades');
      toast.error('Failed to load trades');
    } finally {
      setIsLoading(false);
    }
  };
  const addTrade = async (tradeData: Omit<Trade, 'id'>) => {
    try {
      console.log('useTrades addTrade called with:', tradeData);
      const newTrade = await tradesService.addTrade(tradeData);
      if (newTrade) {
        setTrades(prev => [newTrade, ...prev]);
        toast.success('Trade added successfully!');
        console.log('Trade added to state:', newTrade);
        return newTrade;
      } else {
        throw new Error('Failed to add trade: No trade returned');
      }
    } catch (err) {
      console.error('Error adding trade:', err);
      toast.error(`Failed to add trade: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  const updateTrade = async (tradeId: string, updates: Partial<Trade>) => {
    try {
      const updatedTrade = await tradesService.updateTrade(tradeId, updates);
      if (updatedTrade) {
        setTrades(prev => 
          prev.map(trade => 
            trade.id === tradeId ? updatedTrade : trade
          )
        );
        toast.success('Trade updated successfully!');
        return updatedTrade;
      }
    } catch (err) {
      console.error('Error updating trade:', err);
      toast.error('Failed to update trade');
      throw err;
    }
  };  const deleteTrade = async (tradeId: string) => {
    try {
      const success = await tradesService.deleteTrade(tradeId);
      if (success) {
        setTrades(prev => prev.filter(trade => trade.id !== tradeId));
        
        // Dispatch custom event to notify other components (like journal) that a trade was deleted
        window.dispatchEvent(new CustomEvent(TRADE_DELETED_EVENT, { 
          detail: { tradeId } 
        }));
        
        toast.success('Trade and linked journal entries deleted successfully!');
        return true;
      }
    } catch (err) {
      console.error('Error deleting trade:', err);
      toast.error('Failed to delete trade');
      throw err;
    }
    return false;
  };

  const refreshTrades = () => {
    if (isAuthenticated && user) {
      loadTrades();
    }
  };

  return {
    trades,
    isLoading,
    error,
    addTrade,
    updateTrade,
    deleteTrade,
    refreshTrades,
  };
}
