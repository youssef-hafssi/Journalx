import { supabase } from './supabase';
import { type Trade } from '@/components/dashboard/RecentTrades';

// Transform Trade interface to match Supabase schema
interface SupabaseTrade {
  id?: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Extended fields for our Trade interface
  pnl?: number;
  entry_date?: string;
  exit_date?: string;
  trade_type?: 'long' | 'short';
  session?: 'Asia' | 'London' | 'NY AM' | 'NY PM';
  timeframe?: string;
  entry_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  order_type?: 'Market' | 'Limit' | 'Stop';
  risk_per_trade?: number;
  reward_to_risk_ratio?: number;
  entry_model?: string;
  news?: any;
  mistakes_made?: string;
  lessons_learned?: string;
  trade_rating?: number;
}

// Convert Trade to Supabase format
function tradeToSupabase(trade: Trade, userId: string): SupabaseTrade {
  // Ensure we have minimum required fields
  const symbol = trade.symbol || 'UNKNOWN';
  const side = trade.tradeType === 'long' ? 'buy' : 'sell';
  const quantity = 1; // Default quantity
  const price = trade.entryPrice || trade.exitPrice || 0;
  const total = Math.abs(trade.pnl || 0);
  
  console.log('Converting trade to Supabase format:', {
    symbol,
    side,
    quantity,
    price,
    total,
    trade
  });

  return {
    user_id: userId,
    symbol,
    side,
    quantity,
    price,
    fee: 0, // Default fee
    total,
    status: 'closed',
    notes: `${trade.mistakesMade || ''} ${trade.lessonsLearned || ''}`.trim() || null,
    pnl: trade.pnl || null,
    entry_date: trade.entryDate?.toISOString() || null,
    exit_date: trade.exitDate?.toISOString() || null,
    trade_type: trade.tradeType || null,
    session: trade.session || null,
    timeframe: trade.timeframe || null,
    entry_price: trade.entryPrice || null,
    exit_price: trade.exitPrice || null,
    stop_loss: trade.stopLoss || null,
    take_profit: trade.takeProfit || null,
    order_type: trade.orderType || null,
    risk_per_trade: trade.riskPerTrade || null,
    reward_to_risk_ratio: trade.rewardToRiskRatio || null,
    entry_model: trade.entryModel || null,
    news: trade.news ? JSON.stringify(trade.news) : null,
    mistakes_made: trade.mistakesMade || null,
    lessons_learned: trade.lessonsLearned || null,
    trade_rating: trade.tradeRating || null,
  };
}

// Convert Supabase format to Trade
export function supabaseToTrade(supabaseTrade: any): Trade {
  // Helper function to safely format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }

    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const tradeDate = supabaseTrade.exit_date || supabaseTrade.entry_date || supabaseTrade.created_at;

  return {
    id: supabaseTrade.id,
    date: formatDate(tradeDate),
    symbol: supabaseTrade.symbol,
    pnl: supabaseTrade.pnl || 0,
    entryDate: supabaseTrade.entry_date ? (() => {
      const date = new Date(supabaseTrade.entry_date);
      return isNaN(date.getTime()) ? undefined : date;
    })() : undefined,
    exitDate: supabaseTrade.exit_date ? (() => {
      const date = new Date(supabaseTrade.exit_date);
      return isNaN(date.getTime()) ? undefined : date;
    })() : undefined,
    tradeType: supabaseTrade.trade_type || (supabaseTrade.side === 'buy' ? 'long' : 'short'),
    session: supabaseTrade.session,
    timeframe: supabaseTrade.timeframe,
    entryPrice: supabaseTrade.entry_price,
    exitPrice: supabaseTrade.exit_price,
    stopLoss: supabaseTrade.stop_loss,
    takeProfit: supabaseTrade.take_profit,
    orderType: supabaseTrade.order_type,
    riskPerTrade: supabaseTrade.risk_per_trade,
    rewardToRiskRatio: supabaseTrade.reward_to_risk_ratio,
    entryModel: supabaseTrade.entry_model,
    news: supabaseTrade.news ? JSON.parse(supabaseTrade.news) : undefined,
    mistakesMade: supabaseTrade.mistakes_made,
    lessonsLearned: supabaseTrade.lessons_learned,
    tradeRating: supabaseTrade.trade_rating,
  };
}

export const tradesService = {
  // Get all trades for the current user
  async getTrades(): Promise<Trade[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        throw error;
      }

      return data?.map(supabaseToTrade) || [];
    } catch (error) {
      console.error('Error in getTrades:', error);
      return [];
    }
  },  // Add a new trade
  async addTrade(trade: Omit<Trade, 'id'>): Promise<Trade | null> {
    console.log('🚀 Starting addTrade function');
    console.log('📋 Input trade data:', trade);
    
    try {
      console.log('🔐 Getting user authentication...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ User authentication error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('❌ User not authenticated - no user object');
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated successfully:', user.id);

      // Create trade data without ID (let Supabase generate UUID)
      console.log('🔄 Converting trade to Supabase format...');
      const supabaseTrade = tradeToSupabase({ ...trade, id: '' }, user.id);
      
      console.log('📤 Supabase trade data to insert:', JSON.stringify(supabaseTrade, null, 2));
      
      console.log('💾 Inserting into Supabase...');
      const { data, error } = await supabase
        .from('trades')
        .insert([supabaseTrade])
        .select()
        .single();

      console.log('📨 Supabase insert response:', { data, error });

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from insert');
        throw new Error('No data returned from insert operation');
      }

      console.log('🔄 Converting Supabase response back to Trade format...');
      const newTrade = supabaseToTrade(data);
      console.log('✅ Final converted trade:', newTrade);
      
      return newTrade;
    } catch (error) {
      console.error('💥 Critical error in addTrade:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  },

  // Update an existing trade
  async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<Trade | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the existing trade first
      const { data: existingTrade, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingTrade) {
        throw new Error('Trade not found');
      }

      // Convert existing trade to Trade format, apply updates, then convert back
      const currentTrade = supabaseToTrade(existingTrade);
      const updatedTrade = { ...currentTrade, ...updates };
      const supabaseUpdates = tradeToSupabase(updatedTrade, user.id);

      const { data, error } = await supabase
        .from('trades')
        .update(supabaseUpdates)
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating trade:', error);
        throw error;
      }

      return data ? supabaseToTrade(data) : null;
    } catch (error) {
      console.error('Error in updateTrade:', error);
      throw error;
    }
  },
  // Delete a trade and its associated journal entries
  async deleteTrade(tradeId: string): Promise<boolean> {
    try {
      console.log('🗑️ Starting trade deletion process for:', tradeId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, find and delete all journal entries linked to this trade
      console.log('🔍 Finding journal entries linked to trade:', tradeId);
      
      const { data: linkedEntries, error: fetchError } = await supabase
        .from('journal_entries')
        .select('id, title')
        .eq('trade_id', tradeId)
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching linked journal entries:', fetchError);
        // Continue with trade deletion even if we can't fetch journal entries
      } else if (linkedEntries && linkedEntries.length > 0) {
        console.log(`📝 Found ${linkedEntries.length} linked journal entries:`, 
          linkedEntries.map(e => ({ id: e.id, title: e.title })));
        
        // Delete all linked journal entries
        const { error: deleteJournalError } = await supabase
          .from('journal_entries')
          .delete()
          .eq('trade_id', tradeId)
          .eq('user_id', user.id);

        if (deleteJournalError) {
          console.error('Error deleting linked journal entries:', deleteJournalError);
          throw new Error(`Failed to delete linked journal entries: ${deleteJournalError.message}`);
        }
        
        console.log(`✅ Successfully deleted ${linkedEntries.length} linked journal entries`);
      } else {
        console.log('📝 No journal entries linked to this trade');
      }

      // Now delete the trade itself
      console.log('🗑️ Deleting trade:', tradeId);
      
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting trade:', error);
        throw error;
      }

      console.log('✅ Trade and associated journal entries deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteTrade:', error);
      return false;
    }
  },
};
