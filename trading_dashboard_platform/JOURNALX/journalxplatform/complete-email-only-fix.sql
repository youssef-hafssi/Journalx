-- Complete email-only authentication fix for JournalX
-- Run this ENTIRE script in your Supabase SQL Editor

-- Step 1: Remove problematic Google OAuth functions
DROP FUNCTION IF EXISTS public.generate_verification_token(UUID);
DROP FUNCTION IF EXISTS public.send_verification_email(UUID);
DROP FUNCTION IF EXISTS public.verify_email(TEXT);

-- Step 2: Update the handle_new_user function for simple email authentication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Remove Google OAuth specific columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS verification_token,
DROP COLUMN IF EXISTS verification_sent_at;

-- Step 4: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Email-only authentication fix complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was fixed:';
    RAISE NOTICE '   • Removed Google OAuth verification functions';
    RAISE NOTICE '   • Simplified handle_new_user function';
    RAISE NOTICE '   • Removed Google OAuth columns from profiles';
    RAISE NOTICE '   • Ensured user creation trigger exists';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Email signup should now work without database errors!';
END $$;
