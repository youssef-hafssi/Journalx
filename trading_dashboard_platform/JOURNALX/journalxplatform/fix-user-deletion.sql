-- Fix for Supabase User Deletion Issue
-- Run this SQL in your Supabase SQL Editor to fix the foreign key constraint

-- First, drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
