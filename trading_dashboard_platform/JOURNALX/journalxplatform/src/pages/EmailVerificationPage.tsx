import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const { isAuthenticated, setIsNewUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get various possible token parameters from URL
        const token = searchParams.get('token');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        console.log('Email verification page loaded with params:', { 
          type, 
          hasAccessToken: !!access_token, 
          hasRefreshToken: !!refresh_token,
          hasToken: !!token 
        });
        
        // Check if this is a Supabase email confirmation redirect
        if (type === 'signup' || access_token || token) {
          if (access_token && refresh_token) {
            // Set the session using the tokens from email link
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error('Session verification error:', error);
              setVerificationStatus('error');
              toast.error('Email verification failed. Please try signing in again.');            } else if (data.user) {
              console.log('✅ Email verification successful, setting new user flag');
              setVerificationStatus('success');
              setIsNewUser(true); // Mark as new user since they just verified their email
              
              // Store flag in localStorage for redundancy
              localStorage.setItem('journalx_email_verified_new_user', 'true');
              
              toast.success('Email verified successfully! Welcome to JournalX!');
              console.log('✅ New user flag set, AuthContext will handle redirect to onboarding');
              // Don't redirect here - let the AuthContext handle it
            }
          } else {
            // Handle other verification scenarios - assume success
            setVerificationStatus('success');
            toast.success('Email verified successfully! You can now sign in to your account.');
            // Redirect to auth page for signin after delay
            setTimeout(() => {
              navigate('/auth', { replace: true });
            }, 3000);
          }
        } else {
          // No verification parameters - just show success message
          setVerificationStatus('success');
          toast.success('Email verification completed!');
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        toast.error('An error occurred during email verification.');
      }
    };

    handleEmailVerification();  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Mail className="h-12 w-12 text-blue-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        return 'Email verified successfully!';
      case 'error':
        return 'Verification failed';
      case 'expired':
        return 'Verification link expired';
      default:
        return 'Email verification';
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been verified successfully! You can now access your JournalX account.';
      case 'error':
        return 'There was an issue verifying your email. Please try signing in again.';
      case 'expired':
        return 'The verification link has expired. Please sign up again or request a new verification email.';
      default:
        return 'Verifying your email address...';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#1a1a1a] dark:via-[#1a1a1a] dark:to-[#1a1a1a] opacity-70" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-20" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-20" />
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-20" />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-gray-600 dark:text-gray-300">
              {getStatusMessage()}
            </p>

            <div className="space-y-3">              {verificationStatus === 'success' ? (
                <>
                  {isAuthenticated ? (
                    <Button asChild className="w-full">
                      <Link to="/onboarding">Get Started with Onboarding</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/auth">Sign In to Your Account</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/">Go Home</Link>
                  </Button>
                </>
              ) : verificationStatus === 'error' || verificationStatus === 'expired' ? (
                <>
                  <Button asChild className="w-full">
                    <Link to="/auth">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/">Go Home</Link>
                  </Button>
                </>
              ) : (
                <div className="flex justify-center">
                  <Button asChild variant="outline" className="w-full" disabled>
                    <span>Processing...</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
