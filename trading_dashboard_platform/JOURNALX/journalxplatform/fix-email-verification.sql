-- Fix email verification system
-- Run this in your Supabase SQL Editor

-- Create the missing generate_verification_token function
CREATE OR REPLACE FUNCTION public.generate_verification_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    verification_token TEXT;
    user_email TEXT;
BEGIN
    -- Generate a unique verification token
    verification_token := encode(gen_random_bytes(32), 'hex');
    
    -- Get user email
    SELECT email INTO user_email FROM public.profiles WHERE id = user_id;
    
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_verification_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_verification_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email(TEXT) TO authenticated;

-- Test the function works
DO $$ 
BEGIN
    RAISE NOTICE '✅ Email verification functions updated successfully!';
    RAISE NOTICE 'Functions available: generate_verification_token, send_verification_email, verify_email';
END $$;
