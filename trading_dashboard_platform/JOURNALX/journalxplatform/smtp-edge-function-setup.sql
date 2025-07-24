-- Database function to trigger email sending via Edge Function
-- Run this in your Supabase SQL Editor after running fix-email-verification.sql

-- Update the send_verification_email function to call Edge Function
CREATE OR REPLACE FUNCTION public.send_verification_email(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    verification_token TEXT;
    user_email TEXT;
    user_name TEXT;
    verification_url TEXT;
    payload JSONB;
BEGIN
    -- Generate a unique verification token
    verification_token := encode(gen_random_bytes(32), 'hex');
    
    -- Get user profile
    SELECT email, name INTO user_email, user_name 
    FROM public.profiles 
    WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update profile with verification token and timestamp
    UPDATE public.profiles 
    SET 
        verification_token = verification_token,
        verification_sent_at = NOW()
    WHERE id = user_id;
    
    -- Create verification URL
    verification_url := 'http://localhost:8081/verify-email?token=' || verification_token;
    
    -- Create payload for Edge Function
    payload := jsonb_build_object(
        'to', user_email,
        'name', user_name,
        'verification_url', verification_url,
        'token', verification_token
    );
    
    -- Call Edge Function to send email
    PERFORM net.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/send-verification-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'anon_key'
        ),
        body := payload::text
    );
    
    -- Return the token
    RETURN verification_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.send_verification_email(UUID) TO authenticated;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Updated send_verification_email to use Edge Function!';
    RAISE NOTICE 'Next: Create the Edge Function send-verification-email';
END $$;
