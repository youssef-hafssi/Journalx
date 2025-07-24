import { supabase } from './supabase';
import { type JournalEntry } from '@/types/journal';

// Transform JournalEntry interface to match Supabase schema
interface SupabaseJournalEntry {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  type: 'trade' | 'analysis' | 'reflection' | 'plan';
  trade_id?: string | null;
  recap?: string;
  screenshots?: string[];
  thumbnail?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

// Convert JournalEntry to Supabase format
function journalEntryToSupabase(entry: JournalEntry, userId: string): SupabaseJournalEntry {
  console.log('Converting journal entry to Supabase format:', entry);
  console.log('🖼️ Entry image data:', {
    screenshots: entry.screenshots,
    thumbnail: entry.thumbnail,
    screenshotCount: entry.screenshots ? entry.screenshots.length : 0,
    thumbnailExists: !!entry.thumbnail
  });

  return {
    user_id: userId,
    title: entry.title || 'Untitled Entry',
    content: entry.recap || '', // Map recap to content
    recap: entry.recap || '', // Also store in recap field
    type: 'reflection', // Default type since it's not in the frontend interface
    trade_id: entry.tradeId || null,
    screenshots: entry.screenshots || [],
    thumbnail: entry.thumbnail || null,
    images: entry.screenshots || [], // Store screenshots in both fields for compatibility
  };
}

// Convert Supabase format to JournalEntry
function supabaseToJournalEntry(supabaseEntry: any): JournalEntry {
  console.log('Converting Supabase entry to frontend format:', supabaseEntry);

  // Use screenshots field if available, otherwise fall back to images field, or empty array
  const screenshots = supabaseEntry.screenshots || supabaseEntry.images || [];
  const thumbnail = supabaseEntry.thumbnail;
  
  console.log('🖼️ Image data from database:', {
    screenshots: screenshots,
    thumbnail: thumbnail,
    screenshotCount: screenshots ? screenshots.length : 0,
    thumbnailExists: !!thumbnail,
    thumbnailType: thumbnail ? (thumbnail.startsWith('data:') ? 'data URL' : 'URL') : 'none'
  });
  
  return {
    id: supabaseEntry.id,
    date: new Date(supabaseEntry.created_at).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }),
    title: supabaseEntry.title,
    recap: supabaseEntry.recap || supabaseEntry.content || '', // Use recap field first, then content
    tradeId: supabaseEntry.trade_id,
    screenshots: screenshots,
    thumbnail: thumbnail || undefined,
  };
}

export const journalService = {
  // Get all journal entries for the current user
  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      console.log('🔍 Fetching journal entries...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
      }

      console.log('✅ Journal entries fetched:', data?.length || 0);
      return data?.map(supabaseToJournalEntry) || [];
    } catch (error) {
      console.error('Error in getJournalEntries:', error);
      return [];
    }
  },

  // Add a new journal entry
  async addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): Promise<JournalEntry | null> {
    try {
      console.log('📝 Adding journal entry:', entry);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', user.id);

      const supabaseEntry = journalEntryToSupabase({
        ...entry,
        id: '',
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      }, user.id);
      
      console.log('📤 Supabase journal entry data:', supabaseEntry);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([supabaseEntry])
        .select()
        .single();

      console.log('📨 Supabase journal insert response:', { data, error });

      if (error) {
        console.error('Error adding journal entry:', error);
        throw error;
      }

      const newEntry = data ? supabaseToJournalEntry(data) : null;
      console.log('✅ Journal entry created:', newEntry);
      
      return newEntry;
    } catch (error) {
      console.error('Error in addJournalEntry:', error);
      throw error;
    }
  },
  // Update an existing journal entry
  async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    try {
      console.log('📝 Updating journal entry:', entryId, updates);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the existing entry first
      const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingEntry) {
        console.error('Failed to fetch existing journal entry:', fetchError);
        throw new Error('Journal entry not found');
      }

      console.log('✅ Found existing journal entry:', existingEntry);

      // Convert existing entry to JournalEntry format, apply updates, then convert back
      const currentEntry = supabaseToJournalEntry(existingEntry);
      const updatedEntry = { ...currentEntry, ...updates };
      
      // Create partial update object - only send fields that actually exist in the schema
      const supabaseUpdates: Partial<SupabaseJournalEntry> = {};
      
      if (updates.title !== undefined) {
        supabaseUpdates.title = updatedEntry.title;
      }
      
      if (updates.recap !== undefined) {
        supabaseUpdates.content = updatedEntry.recap;
        supabaseUpdates.recap = updatedEntry.recap;
      }
      
      if (updates.tradeId !== undefined) {
        supabaseUpdates.trade_id = updatedEntry.tradeId || null;
      }
      
      if (updates.screenshots !== undefined) {
        supabaseUpdates.screenshots = updatedEntry.screenshots;
        supabaseUpdates.images = updatedEntry.screenshots; // Store in both fields
      }
      
      if (updates.thumbnail !== undefined) {
        supabaseUpdates.thumbnail = updatedEntry.thumbnail || null;
      }

      console.log('📤 Supabase update data:', supabaseUpdates);

      const { data, error } = await supabase
        .from('journal_entries')
        .update(supabaseUpdates)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      console.log('📨 Supabase update response:', { data, error });

      if (error) {
        console.error('Error updating journal entry:', error);
        throw error;
      }

      const result = data ? supabaseToJournalEntry(data) : null;
      console.log('✅ Journal entry updated:', result);
      
      return result;
    } catch (error) {
      console.error('Error in updateJournalEntry:', error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteJournalEntry(entryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteJournalEntry:', error);
      return false;
    }
  },
};
