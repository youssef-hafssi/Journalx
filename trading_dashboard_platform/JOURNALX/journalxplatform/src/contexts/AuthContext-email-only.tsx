// AuthContext with Email Authentication Only
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, handleSupabaseError, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to transform Supabase user to our User type
  const transformUser = (supabaseUser: SupabaseUser, profile?: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      avatarUrl: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || undefined,
      createdAt: supabaseUser.created_at,
    };
  };

  // Fetch user profile from database
  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return transformUser(supabaseUser);
      }

      // If no profile exists, create one for email users
      if (!profile) {
        console.log('No profile found, creating new profile for user:', supabaseUser.id);
        
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split('@')[0] || 
                'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Return user data anyway, even if profile creation failed
          return transformUser(supabaseUser);
        }

        console.log('Profile created successfully:', createdProfile);
        return transformUser(supabaseUser, createdProfile);
      }

      return transformUser(supabaseUser, profile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return transformUser(supabaseUser);
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (session?.user) {
              const userProfile = await fetchUserProfile(session.user);
              setUser(userProfile);
            } else {
              setUser(null);
            }
            
            setIsLoading(false);
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific login error cases
        if (error.message?.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message?.includes('Email rate limit exceeded')) {
          toast.error('Too many login attempts. Please wait a moment and try again.');
        } else {
          toast.error(handleSupabaseError(error));
        }
        return false;
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user);
        if (userProfile) {
          setUser(userProfile);
          toast.success('Welcome back!');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('User already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else if (error.message?.includes('Email rate limit exceeded')) {
          toast.error('Too many signup attempts. Please wait a moment and try again.');
        } else if (error.message?.includes('For security purposes, you can only request this after')) {
          const match = error.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          toast.error(`Rate limit reached. Please wait ${seconds} seconds before trying again.`);
        } else if (error.message?.includes('Invalid email')) {
          toast.error('Please enter a valid email address.');
        } else if (error.message?.includes('Password should be at least')) {
          toast.error('Password must be at least 6 characters long.');
        } else {
          toast.error(handleSupabaseError(error));
        }
        return false;
      }

      if (data.user) {
        // Check if user already exists but is not confirmed
        if (data.user && !data.session && data.user.email_confirmed_at === null) {
          toast.success('Please check your email to confirm your account before signing in.');
          return true;
        }
        
        // If we have a session, the user is immediately signed in (email confirmation disabled)
        if (data.session) {
          const userProfile = await fetchUserProfile(data.user);
          if (userProfile) {
            setUser(userProfile);
            toast.success('Account created successfully! Welcome to JournalX!');
            return true;
          }
        }
        
        // Email confirmation required
        toast.success('Account created! Please check your email to confirm your account.');
        return true;
      }

      toast.error('Failed to create account. Please try again.');
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred during signup');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error(handleSupabaseError(error));
      } else {
        setUser(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  const updateProfile = async (updates: { name?: string; avatarUrl?: string }): Promise<boolean> => {
    try {
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatarUrl,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        toast.error(handleSupabaseError(error));
        return false;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating profile');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(handleSupabaseError(error));
        return false;
      }

      toast.success('Password reset email sent! Check your inbox.');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred while resetting password');
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
