import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { presenceService } from '@/lib/presence';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; isNewUser?: boolean }>;
  logout: () => Promise<void>;
  setIsNewUser: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Transform Supabase user to our User type
  const transformUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 
            supabaseUser.user_metadata?.full_name || 
            supabaseUser.email?.split('@')[0] || 
            'User',
      createdAt: supabaseUser.created_at,
    };
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(transformUser(session.user));
        }        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth event:', event);
            console.log('🔄 Current URL:', window.location.pathname);
            console.log('🔄 Session user:', session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(transformUser(session.user));
              
              // Check if this is email verification
              const isEmailVerification = window.location.pathname.includes('verify-email') || 
                                        window.location.pathname.includes('auth/confirm') || 
                                        window.location.pathname.includes('auth/callback');
              
              console.log('🔗 Is email verification?', isEmailVerification);
                if (isEmailVerification) {
                console.log('🎯 EMAIL VERIFICATION DETECTED! Setting flags for Index page...');
                setIsNewUser(true);
                // Store flag in localStorage for Index page to pick up
                localStorage.setItem('journalx_email_verified_new_user', 'true');
                toast.success('Email verified successfully! Welcome to JournalX!');
                // Don't redirect here - let Index page handle it
              } else {
                console.log('📝 Regular sign-in detected');
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsNewUser(false); // Clear new user flag on logout
            } else if (session?.user) {
              setUser(transformUser(session.user));
            } else {
              setUser(null);
            }
            setIsLoading(false);
          }
        );

        setIsLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle presence tracking based on authentication state
  useEffect(() => {
    if (user) {
      // User is authenticated, start presence tracking
      presenceService.startPresenceTracking();
    } else {
      // User is not authenticated, stop presence tracking
      presenceService.stopPresenceTracking();
    }

    // Cleanup on unmount
    return () => {
      presenceService.stopPresenceTracking();
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Login failed');
        return false;
      }

      if (data.user) {
        setUser(transformUser(data.user));
        toast.success('Welcome back!');
        return true;
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

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; isNewUser?: boolean }> => {
    try {
      setIsLoading(true);

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
        toast.error(error.message || 'Signup failed');
        return { success: false };
      }

      if (data.user) {
        // If we have a session, user is signed in immediately
        if (data.session) {
          setUser(transformUser(data.user));
          setIsNewUser(true); // Mark as new user for onboarding redirect
          toast.success('Account created successfully! Welcome to JournalX!');
          return { success: true, isNewUser: true };
        } else {
          // Email confirmation required
          toast.success('Account created! Please check your email to verify your account.');
          return { success: true, isNewUser: false };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred during signup');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Error logging out');
      } else {
        setUser(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isNewUser,
    login,
    signup,
    logout,
    setIsNewUser,
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
