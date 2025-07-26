-- Admin Notifications System Schema
-- Run this SQL in your Supabase SQL Editor to add notification functionality

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'error', 'announcement')) DEFAULT 'info',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    target_type TEXT CHECK (target_type IN ('all', 'specific', 'role')) DEFAULT 'all',
    target_users UUID[], -- Array of specific user IDs if target_type is 'specific'
    target_roles TEXT[], -- Array of roles if target_type is 'role' (future use)
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications table to track delivery and read status
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per notification
    UNIQUE(notification_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON public.admin_notifications(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_expires ON public.admin_notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification ON public.user_notifications(notification_id);

-- Enable Row Level Security
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can view targeted notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can manage their own notification records" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can view all notification records" ON public.user_notifications;

-- RLS Policies for admin_notifications
-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = 'dahafssi@gmail.com'
        )
    );

-- Users can view active, non-expired notifications that target them
CREATE POLICY "Users can view targeted notifications" ON public.admin_notifications
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            target_type = 'all'
            OR (target_type = 'specific' AND auth.uid() = ANY(target_users))
        )
    );

-- RLS Policies for user_notifications
-- Users can only see their own notification records
CREATE POLICY "Users can manage their own notification records" ON public.user_notifications
    FOR ALL USING (user_id = auth.uid());

-- Admins can view all notification records for analytics
CREATE POLICY "Admins can view all notification records" ON public.user_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = 'dahafssi@gmail.com'
        )
    );

-- Function to automatically create user_notifications when a new admin_notification is created
CREATE OR REPLACE FUNCTION create_user_notifications()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Only create user notifications for active notifications
    IF NEW.is_active = true THEN
        -- Handle different target types
        IF NEW.target_type = 'all' THEN
            -- Create notifications for all users
            INSERT INTO public.user_notifications (notification_id, user_id)
            SELECT NEW.id, auth.users.id
            FROM auth.users
            WHERE auth.users.id != NEW.admin_id; -- Don't notify the admin who created it

        ELSIF NEW.target_type = 'specific' AND NEW.target_users IS NOT NULL THEN
            -- Create notifications for specific users
            -- Remove admin_id from target_users array and insert remaining users
            INSERT INTO public.user_notifications (notification_id, user_id)
            SELECT NEW.id, user_id
            FROM unnest(array_remove(NEW.target_users, NEW.admin_id)) AS user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user notification creation
DROP TRIGGER IF EXISTS trigger_create_user_notifications ON public.admin_notifications;
CREATE TRIGGER trigger_create_user_notifications
    AFTER INSERT ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION create_user_notifications();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_notifications 
    SET is_read = true, read_at = NOW()
    WHERE user_notifications.notification_id = mark_notification_read.notification_id 
    AND user_id = auth.uid()
    AND is_read = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_notifications 
    SET is_dismissed = true, dismissed_at = NOW()
    WHERE user_notifications.notification_id = dismiss_notification.notification_id 
    AND user_id = auth.uid()
    AND is_dismissed = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.user_notifications un
        JOIN public.admin_notifications an ON un.notification_id = an.id
        WHERE un.user_id = auth.uid()
        AND un.is_read = false
        AND un.is_dismissed = false
        AND an.is_active = true
        AND (an.expires_at IS NULL OR an.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Admin Notifications System Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was created:';
    RAISE NOTICE '   • admin_notifications table for storing notifications';
    RAISE NOTICE '   • user_notifications table for tracking delivery/read status';
    RAISE NOTICE '   • RLS policies for security';
    RAISE NOTICE '   • Automatic user notification creation trigger';
    RAISE NOTICE '   • Helper functions for read/dismiss operations';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Implement the notification service in your app';
    RAISE NOTICE '   2. Create the admin interface for sending notifications';
    RAISE NOTICE '   3. Add real-time subscriptions for instant delivery';
END $$;
