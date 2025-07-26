import { supabase } from './supabase';
import type { AdminUser, AdminTrade, AdminStats, AdminFilters } from '@/types/admin';
import { supabaseToTrade } from './trades';

export class AdminService {
  // Check if current user is admin
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log('Checking admin status for user:', user.email);

      // First check email-based admin access (temporary)
      const adminEmails = ['youssefhafssi@gmail.com', 'dahafssi@gmail.com', 'admin@journalx.com'];
      if (adminEmails.includes(user.email || '')) {
        console.log('User is admin via email check');
        return true;
      }

      // Then check database admin roles
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
        return false;
      }

      const isAdminRole = data?.role === 'admin' || data?.role === 'super_admin';
      console.log('Database admin check result:', isAdminRole);

      return isAdminRole;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users with their profiles and trade statistics
  static async getUsers(filters?: AdminFilters['users']): Promise<AdminUser[]> {
    try {
      console.log('AdminService: Fetching users...');

      // Try to get all users from profiles table with admin bypass
      let users: any[] = [];

      try {
        console.log('AdminService: Attempting to get all profiles...');

        // First, let's try a direct query to see what we can access
        const { data: testQuery, error: testError } = await supabase
          .from('profiles')
          .select('id, email, name')
          .limit(5);

        console.log('AdminService: Test query result:', {
          data: testQuery,
          error: testError,
          count: testQuery?.length || 0
        });

        // Try to get users via RPC function that bypasses RLS
        try {
          console.log('AdminService: Trying RPC function to get all users...');
          const { data: rpcUsers, error: rpcError } = await supabase
            .rpc('get_all_users_for_admin');

          console.log('AdminService: RPC response:', { data: rpcUsers, error: rpcError });

          if (!rpcError && rpcUsers && rpcUsers.length > 0) {
            console.log('AdminService: Successfully got', rpcUsers.length, 'users via RPC');
            users = rpcUsers.map(user => ({
              ...user,
              provider: 'email',
              last_sign_in_at: null,
              email_confirmed_at: null,
              phone: null,
              raw_app_meta_data: null,
              raw_user_meta_data: null,
              is_super_admin: false,
              role: null,
              banned_until: null,
              deleted_at: null
            }));
          } else {
            console.log('AdminService: RPC failed or returned no users:', rpcError);
            throw new Error('RPC method failed: ' + (rpcError?.message || 'Unknown error'));
          }
        } catch (rpcError) {
          console.log('AdminService: RPC method error:', rpcError);

          // Try to get all profiles (this might be limited by RLS)
          let query = supabase
            .from('profiles')
            .select(`
              id,
              email,
              name,
              avatar_url,
              created_at,
              updated_at
            `);

          // Apply filters
          if (filters?.search) {
            query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
          }

          if (filters?.date_from) {
            query = query.gte('created_at', filters.date_from);
          }

          if (filters?.date_to) {
            query = query.lte('created_at', filters.date_to);
          }

          // Apply sorting
          const sortBy = filters?.sort_by || 'created_at';
          const sortOrder = filters?.sort_order || 'desc';
          query = query.order(sortBy, { ascending: sortOrder === 'asc' });

          const { data: profileUsers, error: profileError } = await query;

          if (profileError) {
            console.error('AdminService: Profiles query failed:', profileError);
            throw profileError;
          } else {
            users = profileUsers || [];
            console.log('AdminService: Retrieved', users.length, 'users from profiles table');
          }
        } // End of RPC try-catch

        if (users.length === 0) {
          console.error('AdminService: No users found, this might be due to RLS policies');

          // Try alternative approach - get users from trades table
          console.log('AdminService: Trying to get users from trades table...');
          const { data: tradeUsers, error: tradeError } = await supabase
            .from('trades')
            .select('user_id')
            .not('user_id', 'is', null);

          if (!tradeError && tradeUsers) {
            const uniqueUserIds = [...new Set(tradeUsers.map(t => t.user_id))];
            console.log('AdminService: Found', uniqueUserIds.length, 'unique user IDs from trades');

            // Now get profile info for these users
            const { data: userProfiles, error: userProfileError } = await supabase
              .from('profiles')
              .select(`
                id,
                email,
                name,
                avatar_url,
                created_at,
                updated_at
              `)
              .in('id', uniqueUserIds);

            if (!userProfileError) {
              users = userProfiles || [];
              console.log('AdminService: Retrieved', users.length, 'users from trades->profiles lookup');
            }
          }
        }

        // Add default auth-related fields
        users = users.map(user => ({
          ...user,
          provider: 'email',
          last_sign_in_at: null,
          email_confirmed_at: null,
          phone: null,
          raw_app_meta_data: null,
          raw_user_meta_data: null,
          is_super_admin: false,
          role: null,
          banned_until: null,
          deleted_at: null
        }));

      } catch (error) {
        console.error('AdminService: All user retrieval methods failed:', error);

        // Show SQL function that needs to be created
        console.log('AdminService: To fix this issue, run this SQL in your Supabase SQL editor:');
        console.log(this.getAdminFunctionSQL());

        // Last resort: return current user only
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          console.log('AdminService: Falling back to current user only');
          users = [{
            id: currentUser.id,
            email: currentUser.email || '',
            name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'Current User',
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            created_at: currentUser.created_at || new Date().toISOString(),
            updated_at: currentUser.updated_at || new Date().toISOString(),
            provider: 'email',
            last_sign_in_at: null,
            email_confirmed_at: null,
            phone: null,
            raw_app_meta_data: null,
            raw_user_meta_data: null,
            is_super_admin: false,
            role: null,
            banned_until: null,
            deleted_at: null
          }];
        } else {
          return [];
        }
      }

      // Apply filters to auth users if we got them from auth.users
      if (users && filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          users = users.filter(user =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.name?.toLowerCase().includes(searchLower)
          );
        }

        if (filters.provider) {
          users = users.filter(user => user.provider === filters.provider);
        }

        if (filters.date_from) {
          users = users.filter(user => new Date(user.created_at) >= new Date(filters.date_from!));
        }

        if (filters.date_to) {
          users = users.filter(user => new Date(user.created_at) <= new Date(filters.date_to!));
        }

        // Apply sorting
        const sortBy = filters.sort_by || 'created_at';
        const sortOrder = filters.sort_order || 'desc';
        users.sort((a, b) => {
          const aVal = (a as any)[sortBy];
          const bVal = (b as any)[sortBy];
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
      }

      console.log('AdminService: Found', users?.length || 0, 'users');

      if (!users || users.length === 0) {
        console.log('AdminService: No users found');
        return [];
      }

      // Get comprehensive data for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const tradeStats = await this.getUserTradeStatsSimple(user.id);

          return {
            ...user,
            trade_stats: tradeStats
          };
        })
      );

      console.log('AdminService: Returning', usersWithStats.length, 'users with stats');
      return usersWithStats;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // SQL function to create in Supabase for admin access
  static getAdminFunctionSQL(): string {
    return `
-- Create a function that allows admins to get all users
CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  -- You can modify this check based on your admin logic
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN ('dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_for_admin() TO authenticated;
    `;
  }

  // Get additional user authentication details
  static async getUserAuthDetails(userId: string) {
    try {
      // For now, we'll add some default provider info and return basic structure
      // In the future, this could be enhanced to get more details from other sources
      return {
        provider: 'email', // Default provider
        last_sign_in_at: null,
        email_confirmed_at: null,
        phone: null,
        raw_app_meta_data: null,
        raw_user_meta_data: null,
        is_super_admin: false,
        role: null,
        banned_until: null,
        deleted_at: null
      };
    } catch (error) {
      console.log('Error fetching auth details:', error);
      return {}; // Return empty object on error
    }
  }

  // Get simplified user trade statistics
  static async getUserTradeStatsSimple(userId: string) {
    try {
      // Get basic trade count
      const { count: totalTrades } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get comprehensive trade data
      const { data: tradeData } = await supabase
        .from('trades')
        .select(`
          pnl,
          total,
          created_at,
          entry_date,
          exit_date,
          symbol,
          trade_type,
          session,
          timeframe,
          entry_price,
          exit_price,
          quantity,
          status
        `)
        .eq('user_id', userId);

      if (!tradeData || tradeData.length === 0) {
        return {
          total_trades: 0,
          total_volume: 0,
          total_pnl: 0,
          win_rate: 0,
          avg_trade_size: 0,
          best_trade: 0,
          worst_trade: 0,
          last_trade_date: null,
          most_traded_symbol: null,
          favorite_session: null,
          avg_hold_time_minutes: 0
        };
      }

      const totalPnl = tradeData.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const totalVolume = tradeData.reduce((sum, trade) => sum + (trade.total || 0), 0);
      const winningTrades = tradeData.filter(t => (t.pnl || 0) > 0).length;
      const winRate = tradeData.length ? (winningTrades / tradeData.length) * 100 : 0;

      // Get last trade date
      const lastTradeDate = tradeData
        .map(t => t.exit_date || t.entry_date || t.created_at)
        .filter(Boolean)
        .sort()
        .pop();

      // Get most traded symbol
      const symbolCounts = tradeData.reduce((acc, trade) => {
        if (trade.symbol) {
          acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const mostTradedSymbol = Object.entries(symbolCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

      // Get favorite session
      const sessionCounts = tradeData.reduce((acc, trade) => {
        if (trade.session) {
          acc[trade.session] = (acc[trade.session] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteSession = Object.entries(sessionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

      // Calculate average hold time
      const tradesWithDuration = tradeData.filter(t => t.entry_date && t.exit_date);
      const avgHoldTimeMinutes = tradesWithDuration.length > 0
        ? tradesWithDuration.reduce((sum, trade) => {
            const entryTime = new Date(trade.entry_date!).getTime();
            const exitTime = new Date(trade.exit_date!).getTime();
            return sum + (exitTime - entryTime) / (1000 * 60); // Convert to minutes
          }, 0) / tradesWithDuration.length
        : 0;

      return {
        total_trades: totalTrades || 0,
        total_volume: totalVolume,
        total_pnl: totalPnl,
        win_rate: winRate,
        avg_trade_size: totalTrades ? totalVolume / totalTrades : 0,
        best_trade: Math.max(...tradeData.map(t => t.pnl || 0)),
        worst_trade: Math.min(...tradeData.map(t => t.pnl || 0)),
        last_trade_date: lastTradeDate,
        most_traded_symbol: mostTradedSymbol,
        favorite_session: favoriteSession,
        avg_hold_time_minutes: Math.round(avgHoldTimeMinutes)
      };
    } catch (error) {
      console.error('Error fetching user trade stats:', error);
      return {
        total_trades: 0,
        total_volume: 0,
        total_pnl: 0,
        win_rate: 0,
        avg_trade_size: 0,
        best_trade: 0,
        worst_trade: 0
      };
    }
  }

  // Get user trade statistics
  static async getUserTradeStats(userId: string) {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('pnl, total, created_at, status')
        .eq('user_id', userId);

      if (error) throw error;

      const totalTrades = trades?.length || 0;
      const closedTrades = trades?.filter(t => t.status === 'closed') || [];
      const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
      const avgTradeSize = trades?.length > 0 ? trades.reduce((sum, trade) => sum + trade.total, 0) / trades.length : 0;
      const lastTradeDate = trades?.length > 0 ? trades.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : undefined;

      return {
        total_trades: totalTrades,
        total_pnl: totalPnl,
        win_rate: winRate,
        avg_trade_size: avgTradeSize,
        last_trade_date: lastTradeDate
      };
    } catch (error) {
      console.error('Error fetching user trade stats:', error);
      return {
        total_trades: 0,
        total_pnl: 0,
        win_rate: 0,
        avg_trade_size: 0
      };
    }
  }

  // Get all trades with user information
  static async getTrades(filters?: AdminFilters['trades']): Promise<AdminTrade[]> {
    try {
      console.log('AdminService: Fetching trades...');

      // Use simple trades query without user join to avoid 400 error
      let query = supabase
        .from('trades')
        .select('*');

      // Apply filters
      if (filters?.search) {
        query = query.or(`symbol.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.symbol) {
        query = query.eq('symbol', filters.symbol);
      }

      if (filters?.side) {
        query = query.eq('side', filters.side);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.trade_type) {
        query = query.eq('trade_type', filters.trade_type);
      }

      if (filters?.session) {
        query = query.eq('session', filters.session);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.pnl_min !== undefined) {
        query = query.gte('pnl', filters.pnl_min);
      }

      if (filters?.pnl_max !== undefined) {
        query = query.lte('pnl', filters.pnl_max);
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'created_at';
      const sortOrder = filters?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: trades, error } = await query;

      if (error) {
        console.error('Error fetching trades:', error);
        throw error;
      }

      console.log('AdminService: Found', trades?.length || 0, 'trades');

      // Get user information for trades separately
      if (!trades || trades.length === 0) {
        return [];
      }

      const userIds = [...new Set(trades.map(t => t.user_id))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', userIds);

      // Combine trades with user information
      const tradesWithUsers = trades.map(trade => ({
        ...trade,
        user: users?.find(u => u.id === trade.user_id) || null
      }));

      return tradesWithUsers;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }



  // Get admin dashboard statistics
  static async getStats(): Promise<AdminStats> {
    try {
      console.log('AdminService: Fetching admin stats...');

      // First, let's test what we can actually see
      const { data: testProfiles, error: testError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .limit(10);

      console.log('AdminService: Test profiles query:', { data: testProfiles, error: testError });

      const { data: testTrades, error: testTradesError } = await supabase
        .from('trades')
        .select('id, user_id, symbol')
        .limit(10);

      console.log('AdminService: Test trades query:', { data: testTrades, error: testTradesError });

      // Get basic counts
      console.log('AdminService: Getting basic counts...');
      const [usersResult, tradesResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trades').select('*', { count: 'exact', head: true })
      ]);

      console.log('AdminService: Users query result:', usersResult);
      console.log('AdminService: Trades query result:', tradesResult);

      const totalUsers = usersResult.count || 0;
      const totalTrades = tradesResult.count || 0;

      console.log('AdminService: Total users:', totalUsers, 'Total trades:', totalTrades);

      // Get volume and PnL
      const { data: tradeData } = await supabase
        .from('trades')
        .select('total, pnl');

      const totalVolume = tradeData?.reduce((sum, trade) => sum + (trade.total || 0), 0) || 0;
      const totalPnl = tradeData?.reduce((sum, trade) => sum + (trade.pnl || 0), 0) || 0;

      // Get recent signups
      const { data: recentSignups } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent trades (simplified to avoid relation errors)
      const { data: recentTrades, error: recentTradesError } = await supabase
        .from('trades')
        .select(`
          id,
          user_id,
          symbol,
          side,
          quantity,
          price,
          fee,
          total,
          status,
          pnl,
          trade_type,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('AdminService: Recent trades query:', { data: recentTrades, error: recentTradesError });

      // Get user info for trades separately if trades exist
      let tradesWithUsers = [];
      if (recentTrades && recentTrades.length > 0) {
        const userIds = [...new Set(recentTrades.map(t => t.user_id))];
        const { data: tradeUsers } = await supabase
          .from('profiles')
          .select('id, email, name')
          .in('id', userIds);

        tradesWithUsers = recentTrades.map(trade => ({
          ...trade,
          user: tradeUsers?.find(u => u.id === trade.user_id) || null
        }));
      }

      // Get time-based statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get active users (users who made trades in time periods)
      const [activeUsersToday, activeUsersWeek, activeUsersMonth] = await Promise.all([
        supabase
          .from('trades')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .not('user_id', 'is', null),
        supabase
          .from('trades')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())
          .not('user_id', 'is', null),
        supabase
          .from('trades')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString())
          .not('user_id', 'is', null)
      ]);

      // Get new users (signups in time periods)
      const [newUsersToday, newUsersWeek, newUsersMonth] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString())
      ]);

      // Get trades in time periods
      const [tradesToday, tradesWeek, tradesMonth] = await Promise.all([
        supabase
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase
          .from('trades')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString())
      ]);

      // Get top performers (simplified)
      const topPerformers = await this.getTopPerformersSimple();

      return {
        total_users: totalUsers,
        total_trades: totalTrades,
        total_volume: totalVolume,
        total_pnl: totalPnl,
        active_users_today: activeUsersToday.count || 0,
        active_users_week: activeUsersWeek.count || 0,
        active_users_month: activeUsersMonth.count || 0,
        new_users_today: newUsersToday.count || 0,
        new_users_week: newUsersWeek.count || 0,
        new_users_month: newUsersMonth.count || 0,
        trades_today: tradesToday.count || 0,
        trades_week: tradesWeek.count || 0,
        trades_month: tradesMonth.count || 0,
        avg_trades_per_user: totalUsers > 0 ? totalTrades / totalUsers : 0,
        top_performers: topPerformers,
        recent_signups: recentSignups || [],
        recent_trades: tradesWithUsers.map(trade => ({
          ...trade,
          quantity: trade.quantity || 0,
          price: trade.price || 0,
          fee: trade.fee || 0,
          status: trade.status || 'closed'
        }))
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  // Get top performing users (simplified)
  static async getTopPerformersSimple(limit: number = 10): Promise<AdminUser[]> {
    try {
      // Get all users
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .limit(limit);

      if (!users) return [];

      // Get basic stats for each user
      const usersWithPnl = await Promise.all(
        users.map(async (user) => {
          const stats = await this.getUserTradeStatsSimple(user.id);
          return {
            ...user,
            trade_stats: stats
          };
        })
      );

      // Sort by total PnL and return top performers
      return usersWithPnl
        .filter(user => user.trade_stats.total_pnl > 0)
        .sort((a, b) => b.trade_stats.total_pnl - a.trade_stats.total_pnl)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return [];
    }
  }

  // Get top performing users
  static async getTopPerformers(limit: number = 10): Promise<AdminUser[]> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('*');

      if (!users) return [];

      const usersWithPnl = await Promise.all(
        users.map(async (user) => {
          const stats = await this.getUserTradeStats(user.id);
          return {
            ...user,
            trade_stats: stats
          };
        })
      );

      return usersWithPnl
        .filter(user => user.trade_stats && user.trade_stats.total_pnl > 0)
        .sort((a, b) => (b.trade_stats?.total_pnl || 0) - (a.trade_stats?.total_pnl || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return [];
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Delete user profile (trades will be cascade deleted)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Export data to CSV
  static exportToCSV(data: any[], filename: string) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Grant admin role to user
  static async grantAdminRole(userId: string, role: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { error } = await supabase.rpc('grant_admin_role', {
        target_user_id: userId,
        admin_role: role
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error granting admin role:', error);
      throw error;
    }
  }

  // Get user trades for impersonation
  static async getUserTrades(userId: string): Promise<any[]> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert raw Supabase data to Trade format with proper date handling
      return (data || []).map(supabaseToTrade);
    } catch (error) {
      console.error('Error fetching user trades:', error);
      throw error;
    }
  }

  // Get user profile for impersonation
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Get user journal entries for impersonation
  static async getUserJournalEntries(userId: string): Promise<any[]> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      console.log('🎭 Fetching journal entries for user:', userId);

      const { data, error } = await supabase
        .rpc('get_user_journal_entries_for_admin', {
          target_user_id: userId
        });

      if (error) {
        console.error('Error calling get_user_journal_entries_for_admin:', error);
        throw error;
      }

      console.log('✅ Journal entries fetched for user:', userId, 'count:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching user journal entries:', error);
      throw error;
    }
  }

  // Revoke admin role from user
  static async revokeAdminRole(userId: string): Promise<boolean> {
    try {
      const isAdminUser = await this.isAdmin();
      if (!isAdminUser) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { error } = await supabase.rpc('revoke_admin_role', {
        target_user_id: userId
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error revoking admin role:', error);
      throw error;
    }
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}
