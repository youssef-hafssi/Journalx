-- Simple Admin Setup for JournalX
-- Run this SQL in your Supabase SQL Editor

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'super_admin')) NOT NULL DEFAULT 'admin',
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check admin_roles table
    IF EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE admin_roles.user_id = check_user_id 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check hardcoded admin emails
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = check_user_id 
        AND email IN ('admin@journalx.com', 'youssefhafssi@gmail.com', 'dahafssi@gmail.com')
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin users view (simplified)
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    p.*,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.created_at as auth_created_at,
    ar.role as admin_role,
    0 as total_trades,
    0 as total_volume,
    0 as total_pnl,
    0 as win_rate,
    0 as avg_trade_size,
    0 as best_trade,
    0 as worst_trade
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.admin_roles ar ON p.id = ar.user_id
WHERE public.is_admin(auth.uid());

-- Create admin trades view
CREATE OR REPLACE VIEW public.admin_trades_view AS
SELECT 
    t.*,
    p.name as user_name,
    p.email as user_email
FROM public.trades t
JOIN public.profiles p ON t.user_id = p.id
WHERE public.is_admin(auth.uid());

-- Create admin stats view
CREATE OR REPLACE VIEW public.admin_stats_view AS
SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.trades) as total_trades,
    (SELECT COALESCE(SUM(total), 0) FROM public.trades) as total_volume,
    (SELECT COALESCE(SUM(pnl), 0) FROM public.trades WHERE pnl IS NOT NULL) as total_pnl,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE) as trades_today,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as trades_week,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as trades_month,
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE) as active_users_today,
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as active_users_month,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.profiles) > 0 
        THEN (SELECT COUNT(*) FROM public.trades)::FLOAT / (SELECT COUNT(*) FROM public.profiles)::FLOAT
        ELSE 0 
    END as avg_trades_per_user
WHERE public.is_admin(auth.uid());

-- Create RLS policies
CREATE POLICY "Admin roles viewable by admins" ON public.admin_roles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin roles modifiable by admins" ON public.admin_roles
    FOR ALL USING (public.is_admin(auth.uid()));

-- Grant admin roles to specific users
INSERT INTO public.admin_roles (user_id, role, granted_by)
SELECT 
    u.id,
    'super_admin',
    u.id
FROM auth.users u
WHERE u.email IN ('youssefhafssi@gmail.com', 'dahafssi@gmail.com', 'admin@journalx.com')
ON CONFLICT (user_id) DO NOTHING;
