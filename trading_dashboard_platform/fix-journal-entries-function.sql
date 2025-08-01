-- Fix the get_user_journal_entries_for_admin function to match actual database schema
-- Run this in Supabase SQL Editor

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_journal_entries_for_admin(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated get_user_journal_entries_for_admin function!';
END $$;
