-- Admin Notifications Impersonation Support
-- Run this SQL in your Supabase SQL Editor to add impersonation support for notifications

-- Function to get user notifications for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_user_notifications_for_admin(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    notification_id UUID,
    user_id UUID,
    is_read BOOLEAN,
    is_dismissed BOOLEAN,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    -- Notification details
    notification_title TEXT,
    notification_message TEXT,
    notification_type TEXT,
    notification_priority TEXT,
    notification_created_at TIMESTAMPTZ,
    notification_expires_at TIMESTAMPTZ,
    notification_is_active BOOLEAN
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

    -- Return user notifications with joined admin notification data
    RETURN QUERY
    SELECT 
        un.id,
        un.notification_id,
        un.user_id,
        un.is_read,
        un.is_dismissed,
        un.read_at,
        un.dismissed_at,
        un.delivered_at,
        un.created_at,
        -- Notification details
        an.title as notification_title,
        an.message as notification_message,
        an.type as notification_type,
        an.priority as notification_priority,
        an.created_at as notification_created_at,
        an.expires_at as notification_expires_at,
        an.is_active as notification_is_active
    FROM public.user_notifications un
    JOIN public.admin_notifications an ON un.notification_id = an.id
    WHERE un.user_id = target_user_id
    AND un.is_dismissed = false
    AND an.is_active = true
    AND (an.expires_at IS NULL OR an.expires_at > NOW())
    ORDER BY un.created_at DESC;
END;
$$;

-- Function to get unread notification count for impersonation (admin only)
CREATE OR REPLACE FUNCTION get_unread_count_for_admin(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.email IN ('dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Get unread count for the target user
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM public.user_notifications un
    JOIN public.admin_notifications an ON un.notification_id = an.id
    WHERE un.user_id = target_user_id
    AND un.is_read = false
    AND un.is_dismissed = false
    AND an.is_active = true
    AND (an.expires_at IS NULL OR an.expires_at > NOW());

    RETURN COALESCE(unread_count, 0);
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

    -- Return user journal entries
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
GRANT EXECUTE ON FUNCTION get_user_notifications_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journal_entries_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journal_entry_by_id_for_admin(UUID, UUID) TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Admin Notifications Impersonation Support Added!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '   • get_user_notifications_for_admin() function';
    RAISE NOTICE '   • get_unread_count_for_admin() function';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 These functions allow admins to:';
    RAISE NOTICE '   • View notifications for any user when impersonating';
    RAISE NOTICE '   • Get unread counts for impersonated users';
    RAISE NOTICE '   • Bypass RLS policies securely';
END $$;
