-- Configure Supabase for proper email verification with rate limit handling
-- Run this in your Supabase SQL Editor

-- This script helps you configure email verification properly

DO $$ 
BEGIN
    RAISE NOTICE '📧 CONFIGURING EMAIL VERIFICATION WITH RATE LIMIT HANDLING';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 STEP 1: Configure SMTP in Supabase Dashboard';
    RAISE NOTICE '   1. Go to Authentication > Settings > SMTP Settings';
    RAISE NOTICE '   2. Configure your email provider:';
    RAISE NOTICE '      - Host: smtp.gmail.com (for Gmail)';
    RAISE NOTICE '      - Port: 587';
    RAISE NOTICE '      - Username: your-email@gmail.com';
    RAISE NOTICE '      - Password: your-app-password';
    RAISE NOTICE '      - Sender email: your-email@gmail.com';
    RAISE NOTICE '      - Sender name: JournalX';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ STEP 2: Increase Rate Limits';
    RAISE NOTICE '   1. Go to Authentication > Settings > Rate Limits';
    RAISE NOTICE '   2. Increase these values for development:';
    RAISE NOTICE '      - Email signup: 50 per hour';
    RAISE NOTICE '      - Email OTP: 50 per hour';
    RAISE NOTICE '      - SMS signup: 50 per hour';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ STEP 3: Enable Email Confirmation';
    RAISE NOTICE '   1. Go to Authentication > Settings';
    RAISE NOTICE '   2. CHECK "Enable email confirmations"';
    RAISE NOTICE '   3. Set redirect URL: http://localhost:8080/dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 STEP 4: Test with Different Emails';
    RAISE NOTICE '   - Use test1@example.com, test2@example.com';
    RAISE NOTICE '   - Or use Gmail plus addressing: your.email+test1@gmail.com';
    RAISE NOTICE '';
    RAISE NOTICE '⏰ CURRENT RATE LIMIT: Wait 15-60 minutes for reset';
END $$;
