import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { journalService } from '@/lib/journal';
import { type JournalEntry } from '@/types/journal';
import { toast } from 'sonner';

// Listen for trade deletion events to refresh journal entries
const TRADE_DELETED_EVENT = 'tradeDeleted';

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  // Load journal entries when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadEntries();
    } else {
      setEntries([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Listen for trade deletion events to refresh journal entries
  useEffect(() => {
    const handleTradeDeleted = (event: CustomEvent) => {
      console.log('🔄 Trade deleted event received, refreshing journal entries...', event.detail);
      // Refresh journal entries since linked entries may have been deleted
      if (isAuthenticated && user) {
        loadEntries();
      }
    };

    window.addEventListener(TRADE_DELETED_EVENT, handleTradeDeleted);
    
    return () => {
      window.removeEventListener(TRADE_DELETED_EVENT, handleTradeDeleted);
    };
  }, [isAuthenticated, user]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedEntries = await journalService.getJournalEntries();
      setEntries(fetchedEntries);
    } catch (err) {
      console.error('Error loading journal entries:', err);
      setError('Failed to load journal entries');
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<JournalEntry, 'id' | 'date'>) => {
    console.log('🎯 useJournalEntries addEntry called with:', entryData);
    try {
      console.log('📞 Calling journalService.addJournalEntry...');
      const newEntry = await journalService.addJournalEntry(entryData);
      console.log('📥 journalService.addJournalEntry returned:', newEntry);
      
      if (newEntry) {
        console.log('✅ Journal entry created successfully, updating local state');
        setEntries(prev => {
          console.log('📊 Previous entries count:', prev.length);
          const newEntries = [newEntry, ...prev];
          console.log('📊 New entries count:', newEntries.length);
          return newEntries;
        });
        toast.success('Journal entry added successfully!');
        return newEntry;
      } else {
        console.warn('⚠️ journalService.addJournalEntry returned null/undefined');
        toast.error('Failed to add journal entry - no data returned');
      }
    } catch (err) {
      console.error('💥 Error in useJournalEntries.addEntry:', err);
      console.error('💥 Error details:', JSON.stringify(err, null, 2));
      toast.error('Failed to add journal entry');
      throw err;
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    try {
      const updatedEntry = await journalService.updateJournalEntry(entryId, updates);
      if (updatedEntry) {
        setEntries(prev => 
          prev.map(entry => 
            entry.id === entryId ? updatedEntry : entry
          )
        );
        toast.success('Journal entry updated successfully!');
        return updatedEntry;
      }
    } catch (err) {
      console.error('Error updating journal entry:', err);
      toast.error('Failed to update journal entry');
      throw err;
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const success = await journalService.deleteJournalEntry(entryId);
      if (success) {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        toast.success('Journal entry deleted successfully!');
        return true;
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      toast.error('Failed to delete journal entry');
      throw err;
    }
    return false;
  };

  const refreshEntries = () => {
    if (isAuthenticated && user) {
      loadEntries();
    }
  };

  return {
    entries,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries,
  };
}
