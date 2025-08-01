-- Create user_announcements table to track which announcements users have seen
CREATE TABLE IF NOT EXISTS user_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    announcement_id TEXT NOT NULL,
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only see each announcement once
    UNIQUE(user_id, announcement_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_announcements_user_id ON user_announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_announcements_announcement_id ON user_announcements(announcement_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_announcements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own announcement records
CREATE POLICY "Users can view their own announcements" ON user_announcements
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own announcement records
CREATE POLICY "Users can insert their own announcements" ON user_announcements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own announcement records
CREATE POLICY "Users can update their own announcements" ON user_announcements
    FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_announcements IS 'Tracks which announcements each user has seen';
COMMENT ON COLUMN user_announcements.user_id IS 'Reference to the user who saw the announcement';
COMMENT ON COLUMN user_announcements.announcement_id IS 'Unique identifier for the announcement (e.g., assets-analyzer-launch)';
COMMENT ON COLUMN user_announcements.seen_at IS 'When the user saw/dismissed the announcement';
