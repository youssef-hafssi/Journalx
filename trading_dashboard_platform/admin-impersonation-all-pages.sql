-- Admin Impersonation Support for All Pages
-- Run this SQL in your Supabase SQL Editor to add impersonation support for all pages

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_trades_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_trade_by_id_for_admin(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_edge_configs_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_news_preferences_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_forex_watchlist_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_trading_stats_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_dashboard_data_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_journal_entries_for_admin(UUID);
DROP FUNCTION IF EXISTS get_user_journal_entry_by_id_for_admin(UUID, UUID);

-- Function to get user trades for impersonation (admin only) - for Calendar, Statistical Edge, Edge Builder
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

    -- Return user trades (using actual column names from your database)
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

-- Function to get user trade by ID for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_trade_by_id_for_admin(target_user_id UUID, trade_id UUID)
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

    -- Return specific trade for the target user (using actual column names)
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
    AND t.id = trade_id;
END;
$$;

-- Function to get user edge configurations for impersonation (admin only) - for Edge Builder
CREATE OR REPLACE FUNCTION get_user_edge_configs_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    config_data JSONB,
    is_active BOOLEAN,
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

    -- Return user edge configurations
    RETURN QUERY
    SELECT
        ec.id,
        ec.user_id,
        ec.name,
        ec.description,
        ec.config_data,
        ec.is_active,
        ec.created_at,
        ec.updated_at
    FROM public.edge_configurations ec
    WHERE ec.user_id = target_user_id
    ORDER BY ec.created_at DESC;
END;
$$;

-- Function to get user news preferences for impersonation (admin only) - for News Data
CREATE OR REPLACE FUNCTION get_user_news_preferences_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    preferred_sources TEXT[],
    keywords TEXT[],
    categories TEXT[],
    notification_enabled BOOLEAN,
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

    -- Return user news preferences
    RETURN QUERY
    SELECT
        np.id,
        np.user_id,
        np.preferred_sources,
        np.keywords,
        np.categories,
        np.notification_enabled,
        np.created_at,
        np.updated_at
    FROM public.news_preferences np
    WHERE np.user_id = target_user_id;
END;
$$;

-- Function to get user forex watchlist for impersonation (admin only) - for Forex Assets
CREATE OR REPLACE FUNCTION get_user_forex_watchlist_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    symbol TEXT,
    name TEXT,
    is_favorite BOOLEAN,
    notes TEXT,
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

    -- Return user forex watchlist
    RETURN QUERY
    SELECT
        fw.id,
        fw.user_id,
        fw.symbol,
        fw.name,
        fw.is_favorite,
        fw.notes,
        fw.created_at,
        fw.updated_at
    FROM public.forex_watchlist fw
    WHERE fw.user_id = target_user_id
    ORDER BY fw.created_at DESC;
END;
$$;

-- Function to get user trading statistics for impersonation (admin only) - for Statistical Edge
CREATE OR REPLACE FUNCTION get_user_trading_stats_for_admin(target_user_id UUID)
RETURNS TABLE (
    total_trades BIGINT,
    winning_trades BIGINT,
    losing_trades BIGINT,
    win_rate DECIMAL,
    total_pnl DECIMAL,
    average_win DECIMAL,
    average_loss DECIMAL,
    profit_factor DECIMAL,
    max_drawdown DECIMAL,
    sharpe_ratio DECIMAL,
    best_trade DECIMAL,
    worst_trade DECIMAL,
    average_trade_duration INTERVAL,
    total_commission DECIMAL,
    net_profit DECIMAL
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

    -- Calculate and return trading statistics (using actual column names)
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_trades,
        COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::BIGINT as winning_trades,
        COUNT(CASE WHEN t.pnl <= 0 THEN 1 END)::BIGINT as losing_trades,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0
        END as win_rate,
        COALESCE(SUM(t.pnl), 0) as total_pnl,
        COALESCE(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END), 0) as average_win,
        COALESCE(AVG(CASE WHEN t.pnl <= 0 THEN t.pnl END), 0) as average_loss,
        CASE
            WHEN ABS(AVG(CASE WHEN t.pnl <= 0 THEN t.pnl END)) > 0 THEN
                ABS(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END) / AVG(CASE WHEN t.pnl <= 0 THEN t.pnl END))
            ELSE 0
        END as profit_factor,
        0::DECIMAL as max_drawdown, -- Placeholder for complex calculation
        0::DECIMAL as sharpe_ratio, -- Placeholder for complex calculation
        COALESCE(MAX(t.pnl), 0) as best_trade,
        COALESCE(MIN(t.pnl), 0) as worst_trade,
        INTERVAL '0' as average_trade_duration, -- Placeholder since we don't have exit_time
        0::DECIMAL as total_commission, -- Placeholder since we don't have commission column
        COALESCE(SUM(t.pnl), 0) as net_profit
    FROM public.trades t
    WHERE t.user_id = target_user_id;
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

    -- Calculate and return dashboard statistics (using actual column names)
    RETURN QUERY
    SELECT
        COALESCE(SUM(t.pnl), 0) as total_pnl,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0
        END as win_rate,
        CASE
            WHEN ABS(AVG(CASE WHEN t.pnl <= 0 THEN t.pnl END)) > 0 THEN
                ABS(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END) / AVG(CASE WHEN t.pnl <= 0 THEN t.pnl END))
            ELSE 0
        END as profit_factor,
        0::DECIMAL as risk_to_reward, -- Placeholder since we don't have risk_reward_ratio column
        COUNT(*)::BIGINT as total_trades,
        COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::BIGINT as winning_trades,
        COUNT(CASE WHEN t.pnl <= 0 THEN 1 END)::BIGINT as losing_trades,
        COUNT(CASE WHEN t.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::BIGINT as recent_trades_count,
        COALESCE(SUM(CASE WHEN t.entry_date >= DATE_TRUNC('month', NOW()) THEN t.pnl END), 0) as monthly_pnl,
        COALESCE(SUM(CASE WHEN t.entry_date >= DATE_TRUNC('week', NOW()) THEN t.pnl END), 0) as weekly_pnl,
        COALESCE(SUM(CASE WHEN t.entry_date >= DATE_TRUNC('day', NOW()) THEN t.pnl END), 0) as daily_pnl
    FROM public.trades t
    WHERE t.user_id = target_user_id;
END;
$$;

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_journal_entries_for_admin(UUID);

-- Function to get user journal entries for impersonation (admin only) - for Journal
CREATE OR REPLACE FUNCTION get_user_journal_entries_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    trade_id UUID,
    recap TEXT,
    screenshots TEXT[],
    thumbnail TEXT,
    images TEXT[],
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

    -- Return user journal entries (all columns that exist in the table)
    RETURN QUERY
    SELECT
        je.id,
        je.user_id,
        je.title,
        je.content,
        je.type,
        je.trade_id,
        je.recap,
        je.screenshots,
        je.thumbnail,
        je.images,
        je.created_at,
        je.updated_at
    FROM public.journal_entries je
    WHERE je.user_id = target_user_id
    ORDER BY je.created_at DESC;
END;
$$;

-- Function to get user journal entry by ID for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_journal_entry_by_id_for_admin(target_user_id UUID, entry_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    content TEXT,
    trade_id UUID,
    entry_type TEXT,
    tags TEXT[],
    mood_rating INTEGER,
    market_conditions TEXT,
    lessons_learned TEXT,
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

    -- Return specific journal entry for the target user
    RETURN QUERY
    SELECT
        je.id,
        je.user_id,
        je.title,
        je.content,
        je.trade_id,
        je.entry_type,
        je.tags,
        je.mood_rating,
        je.market_conditions,
        je.lessons_learned,
        je.created_at,
        je.updated_at
    FROM public.journal_entries je
    WHERE je.user_id = target_user_id
    AND je.id = entry_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_trades_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_trade_by_id_for_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_edge_configs_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_news_preferences_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_forex_watchlist_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_trading_stats_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journal_entries_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journal_entry_by_id_for_admin(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin Impersonation Support for All Pages Added!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '   • get_user_trades_for_admin() - for Calendar, Statistical Edge, Edge Builder';
    RAISE NOTICE '   • get_user_trade_by_id_for_admin() - for individual trade details';
    RAISE NOTICE '   • get_user_edge_configs_for_admin() - for Edge Builder configurations';
    RAISE NOTICE '   • get_user_news_preferences_for_admin() - for News Data preferences';
    RAISE NOTICE '   • get_user_forex_watchlist_for_admin() - for Forex Assets watchlist';
    RAISE NOTICE '   • get_user_trading_stats_for_admin() - for Statistical Edge analytics';
    RAISE NOTICE '   • get_user_dashboard_data_for_admin() - for Dashboard metrics';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 These functions allow admins to:';
    RAISE NOTICE '   • View all user data across all pages when impersonating';
    RAISE NOTICE '   • Access trades, journal entries, configurations, and preferences';
    RAISE NOTICE '   • Calculate statistics and analytics for impersonated users';
    RAISE NOTICE '   • Bypass RLS policies securely for admin impersonation';
    RAISE NOTICE '';
    RAISE NOTICE '📄 Supported Pages:';
    RAISE NOTICE '   ✅ Dashboard - user metrics and recent activity';
    RAISE NOTICE '   ✅ Calendar - user trades by date';
    RAISE NOTICE '   ✅ Statistical Edge - trading analytics and performance';
    RAISE NOTICE '   ✅ Edge Builder - user edge configurations';
    RAISE NOTICE '   ✅ Journal - user journal entries (from previous SQL)';
    RAISE NOTICE '   ✅ News Data - user news preferences';
    RAISE NOTICE '   ✅ Forex Assets - user forex watchlist';
END $$;
