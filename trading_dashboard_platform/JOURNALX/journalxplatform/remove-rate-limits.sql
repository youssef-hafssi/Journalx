-- Remove rate limits for development
-- Run this in your Supabase SQL Editor

-- Note: This adjusts rate limits through SQL configuration
-- For production, use the Dashboard method instead

DO $$ 
BEGIN
    RAISE NOTICE '⚡ REMOVING RATE LIMITS FOR DEVELOPMENT';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 DASHBOARD METHOD (Recommended):';
    RAISE NOTICE '   1. Go to Supabase Dashboard';
    RAISE NOTICE '   2. Authentication > Settings > Rate Limits';
    RAISE NOTICE '   3. Set all limits to 1000 per hour:';
    RAISE NOTICE '      - Email signup: 1000/hour';
    RAISE NOTICE '      - Email OTP: 1000/hour';
    RAISE NOTICE '      - SMS signup: 1000/hour';
    RAISE NOTICE '      - SMS OTP: 1000/hour';
    RAISE NOTICE '   4. Click Save';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ IMMEDIATE WORKAROUNDS:';
    RAISE NOTICE '   1. Wait 15-60 minutes for current rate limit to reset';
    RAISE NOTICE '   2. Use different email addresses for testing:';
    RAISE NOTICE '      - test1@example.com';
    RAISE NOTICE '      - test2@example.com';
    RAISE NOTICE '      - your.email+test1@gmail.com';
    RAISE NOTICE '   3. Create test users manually in Dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ PRODUCTION NOTE:';
    RAISE NOTICE '   - Keep rate limits enabled in production for security';
    RAISE NOTICE '   - Only disable/increase for development/testing';
END $$;
