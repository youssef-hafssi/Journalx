-- Fix Admin Impersonation - Clean Setup
-- Run this SQL in your Supabase SQL Editor to fix impersonation issues

-- Drop all existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_trades_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_trade_by_id_for_admin(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_edge_configs_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_news_preferences_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_forex_watchlist_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_trading_stats_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_dashboard_data_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_journal_entries_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_journal_entry_by_id_for_admin(UUID, UUID);

-- Function to get user trades for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_trades_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    symbol TEXT,
    side TEXT,
    quantity DECIMAL,
    price DECIMAL,
    total DECIMAL,
    pnl DECIMAL,
    entry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.email IN ('dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Return trades for the target user
    RETURN QUERY
    SELECT 
        t.id,
        t.user_id,
        t.symbol,
        t.side,
        t.quantity,
        t.price,
        t.total,
        t.pnl,
        t.entry_date,
        t.created_at,
        t.updated_at
    FROM public.trades t
    WHERE t.user_id = target_user_id
    ORDER BY t.entry_date DESC;
END;
$$;

-- Function to get user journal entries for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_journal_entries_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    content TEXT,
    trade_id UUID,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.email IN ('dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Return journal entries for the target user
    RETURN QUERY
    SELECT 
        j.id,
        j.user_id,
        j.title,
        j.content,
        j.trade_id,
        j.image_url,
        j.created_at,
        j.updated_at
    FROM public.journal_entries j
    WHERE j.user_id = target_user_id
    ORDER BY j.created_at DESC;
END;
$$;

-- Function to get user dashboard data for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_dashboard_data_for_admin(target_user_id UUID)
RETURNS TABLE (
    total_pnl DECIMAL,
    win_rate DECIMAL,
    profit_factor DECIMAL,
    risk_to_reward DECIMAL,
    total_trades BIGINT,
    winning_trades BIGINT,
    losing_trades BIGINT,
    recent_trades_count BIGINT,
    monthly_pnl DECIMAL,
    weekly_pnl DECIMAL,
    daily_pnl DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.email IN ('dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Calculate and return dashboard metrics for the target user
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t.pnl), 0) as total_pnl,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE t.pnl > 0) * 100.0 / COUNT(*)), 2)
        END as win_rate,
        CASE 
            WHEN SUM(t.pnl) FILTER (WHERE t.pnl < 0) = 0 THEN 0
            ELSE ROUND(ABS(SUM(t.pnl) FILTER (WHERE t.pnl > 0) / SUM(t.pnl) FILTER (WHERE t.pnl < 0)), 2)
        END as profit_factor,
        CASE 
            WHEN COUNT(*) FILTER (WHERE t.pnl < 0) = 0 THEN 0
            ELSE ROUND(ABS(AVG(t.pnl) FILTER (WHERE t.pnl > 0) / AVG(t.pnl) FILTER (WHERE t.pnl < 0)), 2)
        END as risk_to_reward,
        COUNT(*)::BIGINT as total_trades,
        COUNT(*) FILTER (WHERE t.pnl > 0)::BIGINT as winning_trades,
        COUNT(*) FILTER (WHERE t.pnl < 0)::BIGINT as losing_trades,
        COUNT(*) FILTER (WHERE t.created_at >= NOW() - INTERVAL '7 days')::BIGINT as recent_trades_count,
        COALESCE(SUM(t.pnl) FILTER (WHERE t.entry_date >= DATE_TRUNC('month', NOW())), 0) as monthly_pnl,
        COALESCE(SUM(t.pnl) FILTER (WHERE t.entry_date >= DATE_TRUNC('week', NOW())), 0) as weekly_pnl,
        COALESCE(SUM(t.pnl) FILTER (WHERE t.entry_date >= CURRENT_DATE), 0) as daily_pnl
    FROM public.trades t
    WHERE t.user_id = target_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_trades_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journal_entries_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data_for_admin(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin Impersonation Functions Fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 What was fixed:';
    RAISE NOTICE '   • Dropped all existing conflicting functions';
    RAISE NOTICE '   • Created clean admin impersonation functions';
    RAISE NOTICE '   • Fixed return type conflicts';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Admin impersonation should now work properly!';
    RAISE NOTICE '   • Try impersonating users from the admin dashboard';
    RAISE NOTICE '   • Check browser console for any remaining errors';
END;
$$;
