-- Admin Setup for JournalX
-- Run this SQL in your Supabase SQL Editor to set up admin functionality

-- =====================================================
-- CREATE ADMIN ROLES TABLE
-- =====================================================

-- Create admin_roles table to manage user roles
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

-- Enable RLS on admin_roles table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_roles - only admins can view/modify
CREATE POLICY "Admin roles are viewable by admins only" ON public.admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role IN ('admin', 'super_admin')
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'admin@journalx.com'
        )
    );

CREATE POLICY "Admin roles are modifiable by super admins only" ON public.admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin'
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'admin@journalx.com'
        )
    );

-- =====================================================
-- CREATE ADMIN FUNCTIONS
-- =====================================================

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in admin_roles table
    IF EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE admin_roles.user_id = $1 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is the default admin email
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = $1 
        AND email = 'admin@journalx.com'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check app_metadata for role (fallback)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = $1 
        AND (
            app_metadata->>'role' = 'admin' 
            OR app_metadata->>'role' = 'super_admin'
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant admin role
CREATE OR REPLACE FUNCTION public.grant_admin_role(
    target_user_id UUID,
    admin_role TEXT DEFAULT 'admin'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can grant admin roles';
    END IF;
    
    -- Insert or update admin role
    INSERT INTO public.admin_roles (user_id, role, granted_by)
    VALUES (target_user_id, admin_role, auth.uid())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        granted_by = EXCLUDED.granted_by,
        granted_at = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin role
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can revoke admin roles';
    END IF;
    
    -- Delete admin role
    DELETE FROM public.admin_roles WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE EXISTING POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Create admin-accessible views for user management
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    p.*,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.created_at as auth_created_at,
    u.updated_at as auth_updated_at,
    ar.role as admin_role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.admin_roles ar ON p.id = ar.user_id
WHERE public.is_admin(auth.uid());

-- Create admin-accessible view for all trades
CREATE OR REPLACE VIEW public.admin_trades_view AS
SELECT
    t.*,
    p.name as user_name,
    p.email as user_email
FROM public.trades t
JOIN public.profiles p ON t.user_id = p.id
WHERE public.is_admin(auth.uid());

-- Create admin stats view for dashboard analytics
CREATE OR REPLACE VIEW public.admin_stats_view AS
SELECT
    -- Total counts
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.trades) as total_trades,

    -- Volume and PnL
    (SELECT COALESCE(SUM(total), 0) FROM public.trades) as total_volume,
    (SELECT COALESCE(SUM(pnl), 0) FROM public.trades WHERE pnl IS NOT NULL) as total_pnl,

    -- Time-based statistics (today)
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE) as trades_today,

    -- Time-based statistics (this week)
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as trades_week,

    -- Time-based statistics (this month)
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month,
    (SELECT COUNT(*) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as trades_month,

    -- Active users (users who have made trades)
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE) as active_users_today,
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(DISTINCT user_id) FROM public.trades WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as active_users_month,

    -- Average trades per user
    CASE
        WHEN (SELECT COUNT(*) FROM public.profiles) > 0
        THEN (SELECT COUNT(*) FROM public.trades)::FLOAT / (SELECT COUNT(*) FROM public.profiles)::FLOAT
        ELSE 0
    END as avg_trades_per_user

WHERE public.is_admin(auth.uid());

-- =====================================================
-- GRANT INITIAL ADMIN ACCESS
-- =====================================================

-- Grant admin access to the default admin email
-- Replace 'your-admin-email@example.com' with your actual admin email
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for the admin email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@journalx.com';

    -- If admin user exists, grant them super_admin role
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_roles (user_id, role, granted_by)
        VALUES (admin_user_id, 'super_admin', admin_user_id)
        ON CONFLICT (user_id) DO NOTHING;

        RAISE NOTICE 'Admin role granted to admin@journalx.com';
    ELSE
        RAISE NOTICE 'Admin user admin@journalx.com not found. Please create this user first.';
    END IF;
END $$;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
To use this admin system:

1. Create an admin user account with email 'admin@journalx.com' (or change the email in this script)
2. Run this entire SQL script in your Supabase SQL Editor
3. The admin user will automatically have super_admin privileges
4. Use the following functions to manage admin roles:

-- Grant admin role to a user
SELECT public.grant_admin_role('user-uuid-here', 'admin');

-- Grant super admin role to a user  
SELECT public.grant_admin_role('user-uuid-here', 'super_admin');

-- Revoke admin role from a user
SELECT public.revoke_admin_role('user-uuid-here');

-- Check if current user is admin
SELECT public.is_admin();

-- Check if specific user is admin
SELECT public.is_admin('user-uuid-here');

5. Admin users can access:
   - /admin - Admin dashboard
   - /admin/users - User management
   - /admin/trades - Trade management

6. The admin system includes:
   - Role-based access control
   - Secure functions for role management
   - Admin-only views for sensitive data
   - Automatic fallback to email-based admin access
*/
