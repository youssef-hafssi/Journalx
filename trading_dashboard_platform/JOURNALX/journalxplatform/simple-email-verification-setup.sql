-- Simple Email Verification Setup (No SMTP Required)
-- This setup allows email verification without actual email sending
-- Perfect for development and testing environments

-- =====================================================
-- STEP 1: UPDATE SUPABASE AUTH SETTINGS
-- =====================================================

/*
In your Supabase Dashboard:
1. Go to Authentication → Settings
2. Set "Enable email confirmations" to OFF
3. This allows users to sign up without email verification requirement
4. We'll handle verification manually through the UI
*/

-- =====================================================
-- STEP 2: UPDATE PROFILES TABLE
-- =====================================================

-- Add email verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- STEP 3: CREATE MANUAL VERIFICATION FUNCTIONS
-- =====================================================

-- Function to generate verification token (for manual verification)
CREATE OR REPLACE FUNCTION public.generate_verification_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    verification_token TEXT;
BEGIN
    -- Generate a simple verification token
    verification_token := encode(gen_random_bytes(32), 'hex');
    
    -- Update profile with verification token and timestamp
    UPDATE public.profiles 
    SET 
        verification_token = verification_token,
        verification_sent_at = NOW()
    WHERE id = user_id;
    
    -- Return the token
    RETURN verification_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually verify email (for development)
CREATE OR REPLACE FUNCTION public.manual_verify_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Update user verification status by email
    UPDATE public.profiles 
    SET 
        email_verified = TRUE,
        verification_token = NULL,
        verification_sent_at = NULL
    WHERE 
        email = user_email;
    
    -- Check if any row was updated
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify email using token
CREATE OR REPLACE FUNCTION public.verify_email_token(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Update user verification status if token matches
    UPDATE public.profiles 
    SET 
        email_verified = TRUE,
        verification_token = NULL,
        verification_sent_at = NULL
    WHERE 
        verification_token = token;
    
    -- Check if any row was updated
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: UPDATE TRIGGER FOR NEW USERS
-- =====================================================

-- Update handle_new_user function to set email as unverified by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        FALSE -- Always start as unverified
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_verification_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_verify_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;

-- =====================================================
-- STEP 6: CREATE ADMIN VERIFICATION VIEW
-- =====================================================

-- Create a view to see all users and their verification status
CREATE OR REPLACE VIEW public.user_verification_status AS
SELECT 
    id,
    email,
    name,
    email_verified,
    verification_token,
    verification_sent_at,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.user_verification_status TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Simple email verification setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What this setup provides:';
    RAISE NOTICE '   ✓ Users can sign up without email confirmation';
    RAISE NOTICE '   ✓ Email verification is handled in the app UI';
    RAISE NOTICE '   ✓ Manual verification function for testing';
    RAISE NOTICE '   ✓ Token-based verification for production';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 For development testing:';
    RAISE NOTICE '   - Use manual_verify_email(''user@example.com'') function';
    RAISE NOTICE '   - Check user_verification_status view';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 No SMTP configuration needed!';
END $$;
