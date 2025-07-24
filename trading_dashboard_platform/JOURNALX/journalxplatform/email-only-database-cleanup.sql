-- Remove Google OAuth specific fields and simplify for email-only authentication
-- Run this in your Supabase SQL Editor

-- Update the handle_new_user function to only handle email users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, provider, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        'email',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Remove the Google OAuth specific functions if not needed
-- DROP FUNCTION IF EXISTS public.generate_verification_token(UUID);
-- DROP FUNCTION IF EXISTS public.send_verification_email(UUID);
-- DROP FUNCTION IF EXISTS public.verify_email(TEXT);

-- Optional: Remove Google OAuth specific columns if you want to clean up
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS verification_token;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS verification_sent_at;

-- Keep the provider and email_verified columns as they're still useful for email auth

DO $$ 
BEGIN
    RAISE NOTICE '✅ Database updated for email-only authentication!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '   • Updated handle_new_user function for email-only users';
    RAISE NOTICE '   • Google OAuth functions preserved (commented out removal)';
    RAISE NOTICE '   • Provider and email_verified columns kept for email auth';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is now configured for standard Supabase email authentication';
END $$;
