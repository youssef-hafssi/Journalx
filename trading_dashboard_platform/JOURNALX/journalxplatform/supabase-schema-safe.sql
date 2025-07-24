-- JournalX Database Schema for Supabase (Safe Update Version)
-- Run this SQL in your Supabase SQL Editor to safely update the database

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Add new columns to trades table if they don't exist
DO $$ 
BEGIN
    -- Add provider column to profiles table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider') THEN
        ALTER TABLE public.profiles ADD COLUMN provider TEXT DEFAULT 'email';
    END IF;

    -- Add extended fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'pnl') THEN
        ALTER TABLE public.trades ADD COLUMN pnl DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_date') THEN
        ALTER TABLE public.trades ADD COLUMN entry_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'exit_date') THEN
        ALTER TABLE public.trades ADD COLUMN exit_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type') THEN
        ALTER TABLE public.trades ADD COLUMN trade_type TEXT CHECK (trade_type IN ('long', 'short'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'session') THEN
        ALTER TABLE public.trades ADD COLUMN session TEXT CHECK (session IN ('Asia', 'London', 'NY AM', 'NY PM'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'timeframe') THEN
        ALTER TABLE public.trades ADD COLUMN timeframe TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price') THEN
        ALTER TABLE public.trades ADD COLUMN entry_price DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'exit_price') THEN
        ALTER TABLE public.trades ADD COLUMN exit_price DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'stop_loss') THEN
        ALTER TABLE public.trades ADD COLUMN stop_loss DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'take_profit') THEN
        ALTER TABLE public.trades ADD COLUMN take_profit DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'order_type') THEN
        ALTER TABLE public.trades ADD COLUMN order_type TEXT CHECK (order_type IN ('Market', 'Limit', 'Stop'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'risk_per_trade') THEN
        ALTER TABLE public.trades ADD COLUMN risk_per_trade DECIMAL(20, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'reward_to_risk_ratio') THEN
        ALTER TABLE public.trades ADD COLUMN reward_to_risk_ratio DECIMAL(10, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_model') THEN
        ALTER TABLE public.trades ADD COLUMN entry_model TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'news') THEN
        ALTER TABLE public.trades ADD COLUMN news JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'mistakes_made') THEN
        ALTER TABLE public.trades ADD COLUMN mistakes_made TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'lessons_learned') THEN
        ALTER TABLE public.trades ADD COLUMN lessons_learned TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_rating') THEN
        ALTER TABLE public.trades ADD COLUMN trade_rating INTEGER CHECK (trade_rating >= 1 AND trade_rating <= 10);
    END IF;
END $$;

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('trade', 'analysis', 'reflection', 'plan')) NOT NULL,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    recap TEXT,
    screenshots TEXT[], -- Array of image URLs or base64 strings
    thumbnail TEXT, -- Thumbnail image URL or base64 string
    images TEXT[], -- Additional images array for compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add image-related columns to journal_entries if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'recap') THEN
        ALTER TABLE public.journal_entries ADD COLUMN recap TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'screenshots') THEN
        ALTER TABLE public.journal_entries ADD COLUMN screenshots TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'thumbnail') THEN
        ALTER TABLE public.journal_entries ADD COLUMN thumbnail TEXT;
    END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'images') THEN
        ALTER TABLE public.journal_entries ADD COLUMN images TEXT[];
    END IF;
END $$;

-- Update foreign key constraint for cascade deletion
DO $$
BEGIN
    -- Check if the constraint exists and has SET NULL behavior
    IF EXISTS (
        SELECT 1 
        FROM information_schema.referential_constraints 
        WHERE constraint_name = 'journal_entries_trade_id_fkey' 
        AND delete_rule = 'SET NULL'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_trade_id_fkey;
        
        -- Recreate the constraint with CASCADE DELETE
        ALTER TABLE public.journal_entries 
        ADD CONSTRAINT journal_entries_trade_id_fkey 
        FOREIGN KEY (trade_id) 
        REFERENCES public.trades(id) 
        ON DELETE CASCADE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint might not exist or have a different name, which is fine
        NULL;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON public.journal_entries(type);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop and recreate to avoid conflicts)

-- Drop existing policies if they exist
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

-- Recreate policies

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

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
