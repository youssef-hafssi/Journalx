// AuthContext with Email Authentication
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
      name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatarUrl: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
      createdAt: supabaseUser.created_at,
      emailVerified: profile?.email_verified || false,
      provider: profile?.provider || 'email',
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

      // Check if this is a Google OAuth user and what action was intended
      const isGoogleUser = supabaseUser.app_metadata?.provider === 'google';
      const intendedAction = getGoogleOAuthAction();
      
      // If no profile exists, check if this is a Google sign-in attempt
      if (!profile) {
        if (isGoogleUser && intendedAction === 'signin') {
          // User tried to sign in with Google but doesn't have an account
          console.log('Google sign-in attempted for non-existing user');
          clearGoogleOAuthAction();
          
          // Sign out the user
          await supabase.auth.signOut();
          
          toast.error('No account found with this Google email. Please sign up first or use a different sign-in method.');
          return null;
        }
        
        console.log('No profile found, creating new profile for user:', supabaseUser.id);
        
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.email?.split('@')[0] || 
                'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
          provider: supabaseUser.app_metadata?.provider || 'email',
          email_verified: false // Google OAuth users start unverified
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
        
        // Clear the Google OAuth action after successful signup
        if (isGoogleUser) {
          clearGoogleOAuthAction();
          if (intendedAction === 'signup') {
            // Don't show success message yet - they need to verify email
            toast.info('Please check your email for verification before accessing your account.');
            
            // Send verification email automatically for Google OAuth users
            try {
              await sendVerificationEmailInternal(supabaseUser.id);
            } catch (emailError) {
              console.error('Failed to send verification email:', emailError);
            }
          }
        }
        
        return transformUser(supabaseUser, createdProfile);
      }

      // Profile exists - check verification status for Google users
      if (isGoogleUser && !profile.email_verified) {
        clearGoogleOAuthAction();
        toast.warning('Please verify your email before accessing your account. Check your inbox for the verification link.');
        return transformUser(supabaseUser, profile);
      }

      // Profile exists and is verified - clear any pending Google OAuth action
      if (isGoogleUser) {
        clearGoogleOAuthAction();
        if (intendedAction === 'signin') {
          toast.success('Welcome back!');
        }
      }

      return transformUser(supabaseUser, profile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return transformUser(supabaseUser);
    }
  };  // Internal function to send verification email
  const sendVerificationEmailInternal = async (userId: string) => {
    try {
      // Generate a verification token and store it in the profile
      const { data: token, error } = await supabase.rpc('generate_verification_token', {
        user_id: userId
      });

      if (error) {
        console.error('Error generating verification token:', error);
        throw error;
      }

      // Get user profile to get email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      // Create verification URL
      const verificationUrl = `${window.location.origin}/verify-email?token=${token}`;
      
      // Create beautiful email template
      const emailHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">
                📊 JournalX
              </h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">
                Trading Journal Platform
              </p>
            </div>

            <!-- Main Content -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="background-color: #3b82f6; color: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                ✉️
              </div>
              
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">
                Verify Your Email Address
              </h2>
              
              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                Hi <strong>${profile.name}</strong>,
              </p>
              
              <p style="color: #4b5563; margin: 0 0 32px 0; font-size: 16px; line-height: 1.5;">
                Thank you for signing up with JournalX! To complete your account setup and start using our trading journal platform, please verify your email address by clicking the button below:
              </p>

              <!-- Verification Button -->
              <div style="margin: 40px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  ✅ Verify Email Address
                </a>
              </div>

              <p style="color: #6b7280; margin: 24px 0; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                  ${verificationUrl}
                </a>
              </div>

              <div style="background-color: #fef3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 32px 0; text-align: left;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">
            
            <div style="text-align: center;">
              <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
                🚀 <strong>What's next after verification?</strong>
              </p>
              <ul style="color: #6b7280; font-size: 14px; text-align: left; max-width: 400px; margin: 0 auto; padding-left: 20px;">
                <li>Access your personalized trading dashboard</li>
                <li>Start logging your trades and analyzing performance</li>
                <li>Use advanced journal features to improve your trading</li>
                <li>Track your progress with detailed analytics</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                If you didn't create an account with JournalX, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 JournalX - Professional Trading Journal Platform
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email via our SMTP server
      try {
        const response = await fetch('http://localhost:3001/api/send-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: profile.email,
            subject: 'Verify your JournalX account',
            html: emailHTML,
            name: profile.name,
            verificationUrl
          })
        });

        if (!response.ok) {
          throw new Error(`Email server responded with ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          toast.success('📧 Verification email sent! Please check your inbox.');
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Fallback: show the verification link for testing
        console.log(`📧 Verification link (email failed): ${verificationUrl}`);
        toast.warning('Email sending failed. Check console for verification link.');
      }
      
      return token;
    } catch (error) {
      console.error('Error in sendVerificationEmailInternal:', error);
      throw error;
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
          // Only set user if profile was successfully created/retrieved
          if (userProfile) {
            setUser(userProfile);
          } else {
            setUser(null);
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (session?.user) {
              const userProfile = await fetchUserProfile(session.user);
              // Only set user if profile was successfully created/retrieved
              if (userProfile) {
                setUser(userProfile);
              } else {
                setUser(null);
              }
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

  const signInWithGoogle = async (): Promise<void> => {
    try {
      // Set the intended action before starting OAuth flow
      setGoogleOAuthAction('signin');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        clearGoogleOAuthAction();
        toast.error(handleSupabaseError(error));
      }
      // Note: The actual sign-in completion will be handled by the auth state change listener
    } catch (error) {
      console.error('Google sign-in error:', error);
      clearGoogleOAuthAction();
      toast.error('An error occurred during Google sign-in');
    }
  };

  const signUpWithGoogle = async (): Promise<void> => {
    try {
      // Set the intended action before starting OAuth flow
      setGoogleOAuthAction('signup');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/verify-email`, // Redirect to verification page
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google sign-up error:', error);
        clearGoogleOAuthAction();
        toast.error(handleSupabaseError(error));
      }
      // Note: The actual sign-up completion will be handled by the auth state change listener
    } catch (error) {
      console.error('Google sign-up error:', error);
      clearGoogleOAuthAction();
      toast.error('An error occurred during Google sign-up');
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
        clearGoogleOAuthAction();
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

  const sendVerificationEmail = async (): Promise<boolean> => {
    try {
      if (!user) {
        toast.error('No user found. Please sign in first.');
        return false;
      }

      await sendVerificationEmailInternal(user.id);
      toast.success('Verification email sent! Check your inbox.');
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error('Failed to send verification email. Please try again.');
      return false;
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_email', {
        token: token
      });

      if (error) {
        console.error('Email verification error:', error);
        toast.error('Invalid or expired verification token.');
        return false;
      }

      if (data) {
        // Update local user state
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        toast.success('Email verified successfully! You can now access your account.');
        return true;
      } else {
        toast.error('Invalid or expired verification token.');
        return false;
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast.error('An error occurred during email verification.');
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user && (user.emailVerified || user.provider === 'email'),
    isEmailVerified: user?.emailVerified || false,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
    updateProfile,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
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
