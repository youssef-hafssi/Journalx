-- Update journal_entries foreign key constraint to cascade delete
-- Run this SQL in your Supabase SQL Editor to enable automatic journal deletion when trades are deleted

-- First, we need to drop the existing foreign key constraint and recreate it with CASCADE
-- This will make journal entries automatically delete when their linked trade is deleted

DO $$
BEGIN
    RAISE NOTICE 'Updating journal_entries foreign key constraint for cascade deletion...';
    
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'journal_entries_trade_id_fkey' 
        AND table_name = 'journal_entries'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE public.journal_entries DROP CONSTRAINT journal_entries_trade_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
    
    -- Recreate the constraint with CASCADE DELETE
    ALTER TABLE public.journal_entries 
    ADD CONSTRAINT journal_entries_trade_id_fkey 
    FOREIGN KEY (trade_id) 
    REFERENCES public.trades(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Updated foreign key constraint to CASCADE DELETE';
    RAISE NOTICE '✅ Journal entries will now be automatically deleted when their linked trade is deleted';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error updating constraint: %', SQLERRM;
        RAISE NOTICE 'This is expected if the constraint name is different or doesn''t exist';
        RAISE NOTICE 'Application-level deletion in trades.ts will still work correctly';
END $$;

-- Verify the constraint was updated
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'journal_entries'
    AND kcu.column_name = 'trade_id';
