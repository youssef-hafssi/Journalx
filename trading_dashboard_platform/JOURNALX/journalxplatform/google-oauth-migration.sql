-- Migration script to add Google OAuth support to existing JournalX databases
-- Run this SQL in your Supabase SQL Editor if you have an existing database

BEGIN;

-- Add provider column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider') THEN
        ALTER TABLE public.profiles ADD COLUMN provider TEXT DEFAULT 'email';
        
        -- Update existing profiles to have 'email' as provider
        UPDATE public.profiles SET provider = 'email' WHERE provider IS NULL;
        
        RAISE NOTICE 'Added provider column to profiles table';
    ELSE
        RAISE NOTICE 'Provider column already exists in profiles table';
    END IF;
END $$;

-- Add comment to document the provider field
COMMENT ON COLUMN public.profiles.provider IS 'Authentication provider used (email, google, etc.)';

COMMIT;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'provider';
