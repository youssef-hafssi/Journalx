import { createClient } from '@supabase/supabase-js'

// These would typically come from environment variables
// For development, you can use a local Supabase instance or create a free project at https://supabase.com

// Debug environment variables
console.log('🔍 Environment Debug:')
console.log('NODE_ENV:', import.meta.env.MODE)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('All env vars:', import.meta.env)
console.log('🔍 Environment Keys:', Object.keys(import.meta.env))
console.log('🔍 Raw env object:', JSON.stringify(import.meta.env, null, 2))

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gixiaqmqcvrrnvnxqewv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpeGlhcW1xY3Zycm52bnhxZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY5NzcsImV4cCI6MjA2ODE4Mjk3N30.4ZiwSIywhewWCEYRkx6AMoi4IYr0iCI3uD38q_i-2DQ'

console.log('🔧 Using Supabase URL:', supabaseUrl)
console.log('🔧 Using API key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for type safety
export interface Database {
  public: {
    Tables: {      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url?: string
          provider?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string
          provider?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          provider?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          fee: number
          total: number
          status: 'open' | 'closed' | 'cancelled'
          created_at: string
          updated_at: string
          notes?: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          price: number
          fee: number
          total: number
          status: 'open' | 'closed' | 'cancelled'
          created_at?: string
          updated_at?: string
          notes?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          side?: 'buy' | 'sell'
          quantity?: number
          price?: number
          fee?: number
          total?: number
          status?: 'open' | 'closed' | 'cancelled'
          updated_at?: string
          notes?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          type: 'trade' | 'analysis' | 'reflection' | 'plan'
          trade_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          type: 'trade' | 'analysis' | 'reflection' | 'plan'
          trade_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          type?: 'trade' | 'analysis' | 'reflection' | 'plan'
          trade_id?: string
          updated_at?: string
        }
      }
      user_announcements: {
        Row: {
          id: string
          user_id: string
          announcement_id: string
          seen_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          announcement_id: string
          seen_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          announcement_id?: string
          seen_at?: string
        }
      }
    }
  }
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Helper function to check if we have valid Supabase configuration
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'http://localhost:54321' && supabaseAnonKey !== 'your-anon-key-here')
}
