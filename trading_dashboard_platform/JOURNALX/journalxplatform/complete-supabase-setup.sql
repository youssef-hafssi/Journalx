-- =====================================================
-- COMPLETE SUPABASE SQL SETUP FOR JOURNALX
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- First, fix the existing foreign key constraint issue for user deletion
-- This allows users to be deleted from Supabase Dashboard
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the foreign key constraint with CASCADE deletion
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create trades table with extended fields for trading journal
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    total DECIMAL(20, 8) NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'cancelled')) DEFAULT 'open',
    notes TEXT,
    
    -- Extended fields for trading journal
    pnl DECIMAL(20, 8),
    entry_date TIMESTAMP WITH TIME ZONE,
    exit_date TIMESTAMP WITH TIME ZONE,
    trade_type TEXT CHECK (trade_type IN ('long', 'short')),
    session TEXT CHECK (session IN ('Asia', 'London', 'NY AM', 'NY PM')),
    timeframe TEXT,
    entry_price DECIMAL(20, 8),
    exit_price DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    order_type TEXT CHECK (order_type IN ('Market', 'Limit', 'Stop')),
    risk_per_trade DECIMAL(20, 8),
    reward_to_risk_ratio DECIMAL(10, 4),
    entry_model TEXT,
    news JSONB,
    mistakes_made TEXT,
    lessons_learned TEXT,
    trade_rating INTEGER CHECK (trade_rating >= 1 AND trade_rating <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('trade', 'analysis', 'reflection', 'plan')) NOT NULL,
    trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON public.journal_entries(type);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON public.trades;

DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Create function to automatically create profile on user signup
-- This handles both email/password and Google OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_provider TEXT;
    is_verified BOOLEAN DEFAULT FALSE;
BEGIN
    -- Get the provider
    user_provider := COALESCE(NEW.app_metadata->>'provider', 'email');
    
    -- Set verification status based on provider
    -- Email users need verification, Google OAuth users start unverified for manual verification
    IF user_provider = 'email' THEN
        is_verified := COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE);
    ELSE
        is_verified := FALSE; -- Google OAuth users need manual verification
    END IF;

    INSERT INTO public.profiles (id, email, name, provider, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        user_provider,
        is_verified
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to send verification email for Google OAuth users
CREATE OR REPLACE FUNCTION public.send_verification_email(user_id UUID)
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
    
    -- Return the token (this would typically trigger an email service)
    RETURN verification_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify email using token
CREATE OR REPLACE FUNCTION public.verify_email(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_found BOOLEAN DEFAULT FALSE;
BEGIN
    -- Update user verification status if token matches and is not expired (24 hours)
    UPDATE public.profiles 
    SET 
        email_verified = TRUE,
        verification_token = NULL,
        verification_sent_at = NULL
    WHERE 
        verification_token = token 
        AND verification_sent_at > NOW() - INTERVAL '24 hours';
    
    -- Check if any row was updated
    GET DIAGNOSTICS user_found = ROW_COUNT;
    
    RETURN user_found > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SETUP COMPLETE MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ JournalX Database Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was configured:';
    RAISE NOTICE '   • Tables: profiles, trades, journal_entries';
    RAISE NOTICE '   • Row Level Security (RLS) enabled';
    RAISE NOTICE '   • Proper CASCADE deletion for user cleanup';
    RAISE NOTICE '   • Auto profile creation for new users';
    RAISE NOTICE '   • Google OAuth support with provider tracking';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Configure Google OAuth in Supabase Dashboard';
    RAISE NOTICE '   2. Test user registration and deletion';
    RAISE NOTICE '   3. Deploy your application';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 User deletion issue: FIXED';
    RAISE NOTICE '   Users can now be deleted from Supabase Dashboard';
END $$;
