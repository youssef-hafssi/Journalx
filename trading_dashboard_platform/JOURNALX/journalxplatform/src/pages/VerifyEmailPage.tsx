import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Mail, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [isManualVerifying, setIsManualVerifying] = useState(false);

  // Get token from URL (if any)
  const token = searchParams.get('token');

  useEffect(() => {
    // If user is already verified, redirect to auth
    if (user?.emailVerified) {
      navigate('/auth', { 
        replace: true,
        state: { 
          message: 'Email already verified! Please sign in.',
          type: 'success'
        }
      });
      return;
    }

    // If there's a token in the URL, attempt verification
    if (token) {
      handleTokenVerification(token);
    }
  }, [token, user?.emailVerified, navigate]);

  const handleTokenVerification = async (verificationToken: string) => {
    try {
      setVerificationStatus('pending');
      
      // Call the database function to verify the email token
      const { data, error } = await supabase.rpc('verify_email_token', {
        token: verificationToken
      });

      if (error) {
        console.error('Token verification error:', error);
        setVerificationStatus('error');
        toast.error('Verification failed. The link may be expired or invalid.');
        return;
      }

      if (data) {
        setVerificationStatus('success');
        toast.success('Email verified successfully!');
        
        // Logout and redirect to sign in after verification
        setTimeout(async () => {
          await logout();
          navigate('/auth', { 
            replace: true,
            state: { 
              message: 'Email verified successfully! Please sign in with your credentials.',
              type: 'success'
            }
          });
        }, 3000);
      } else {
        setVerificationStatus('error');
        toast.error('Verification failed. The link may be expired or invalid.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      toast.error('An error occurred during verification.');
    }
  };

  // Manual verification for development/testing
  const handleManualVerification = async () => {
    if (!user?.email) {
      toast.error('No user email found');
      return;
    }

    setIsManualVerifying(true);
    try {
      // Call the manual verification function
      const { data, error } = await supabase.rpc('manual_verify_email', {
        user_email: user.email
      });

      if (error) {
        console.error('Manual verification error:', error);
        toast.error('Manual verification failed');
        return;
      }

      if (data) {
        setVerificationStatus('success');
        toast.success('Email verified manually!');
        
        // Logout and redirect to sign in after verification
        setTimeout(async () => {
          await logout();
          navigate('/auth', { 
            replace: true,
            state: { 
              message: 'Email verified successfully! Please sign in with your credentials.',
              type: 'success'
            }
          });
        }, 3000);
      } else {
        toast.error('Manual verification failed');
      }
    } catch (error) {
      console.error('Manual verification error:', error);
      toast.error('An error occurred during manual verification');
    } finally {
      setIsManualVerifying(false);
    }
  };

  const getStatusContent = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          title: 'Email Verified Successfully!',
          description: 'Your email has been verified. You will be redirected to the sign-in page shortly.',
          color: 'text-green-600',
        };
      
      case 'error':
        return {
          icon: <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />,
          title: 'Verification Failed',
          description: token 
            ? 'The verification link is invalid or has expired. You can use manual verification below for testing.'
            : 'Email verification is required to access the platform. Use manual verification for testing.',
          color: 'text-red-600',
        };
      
      default:
        return {
          icon: <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />,
          title: 'Email Verification Required',
          description: user?.email 
            ? `Email verification is required for ${user.email}. Since SMTP is disabled, you can use manual verification for testing.`
            : 'Email verification is required to access the platform.',
          color: 'text-blue-600',
        };
    }
  };

  const statusContent = getStatusContent();

  if (isLoading && !token) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
        
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 dark:opacity-10">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgb(209 213 219) 0%, rgb(243 244 246) 40%, transparent 70%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <BarChart3 className="h-6 w-6 text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Journal<span className="text-red-600">X</span>
          </h1>
          <Badge variant="secondary" className="text-xs">Pro</Badge>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-xl">Email Verification</CardTitle>
              <CardDescription className="text-center">
                Complete your account setup
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Development Mode Notice */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    <Shield className="h-4 w-4" />
                    Development Mode
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    SMTP is disabled. Use manual verification for testing.
                  </p>
                </div>
              )}
              
              {statusContent.icon}
              
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${statusContent.color}`}>
                  {statusContent.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {statusContent.description}
                </p>
              </div>

              {verificationStatus !== 'success' && (
                <div className="space-y-4">
                  {/* Manual Verification for Development */}
                  {process.env.NODE_ENV === 'development' && user && (
                    <Button
                      onClick={handleManualVerification}
                      disabled={isManualVerifying}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isManualVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Manual Verify (Dev Only)
                        </>
                      )}
                    </Button>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {process.env.NODE_ENV === 'development' 
                      ? 'Use manual verification since SMTP is disabled in development.'
                      : 'Email verification is required to access the platform.'
                    }
                  </div>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      await logout();
                      navigate('/auth', { 
                        state: { 
                          message: 'Email verified successfully! Please sign in with your credentials.',
                          type: 'success'
                        }
                      });
                    }}
                    className="w-full"
                  >
                    Go to Sign In
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You will be automatically redirected in a few seconds
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Link 
                  to="/auth" 
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setVerificationStatus('sending');
    try {
      const success = await resendVerificationEmail();
      if (success) {
        // Start cooldown timer (60 seconds)
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setVerificationStatus('pending');
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setVerificationStatus('error');
    }
  };

  const getStatusContent = () => {
    switch (verificationStatus) {      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          title: 'Email Verified Successfully!',
          description: 'Your email has been verified. You will be redirected to the sign-in page shortly.',
          color: 'text-green-600',
        };
      
      case 'error':
        return {
          icon: <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />,
          title: 'Verification Failed',
          description: token 
            ? 'The verification link is invalid or has expired. Please request a new verification email.'
            : 'Unable to verify your email. Please try again.',
          color: 'text-red-600',
        };
      
      case 'sending':
        return {
          icon: <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />,
          title: 'Sending Verification Email...',
          description: 'Please wait while we send you a new verification email.',
          color: 'text-blue-600',
        };
      
      default:
        return {
          icon: <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />,
          title: 'Verify Your Email',
          description: user?.email 
            ? `We've sent a verification email to ${user.email}. Please check your inbox and click the verification link.`
            : 'Please check your email for a verification link to complete your account setup.',
          color: 'text-blue-600',
        };
    }
  };

  const statusContent = getStatusContent();
  if (isLoading && !token) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
        
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 dark:opacity-10">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgb(209 213 219) 0%, rgb(243 244 246) 40%, transparent 70%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <BarChart3 className="h-6 w-6 text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Journal<span className="text-red-600">X</span>
          </h1>
          <Badge variant="secondary" className="text-xs">Pro</Badge>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-center text-xl">Email Verification</CardTitle>
              <CardDescription className="text-center">
                Complete your account setup
              </CardDescription>
            </CardHeader>            <CardContent className="text-center space-y-6">
              {/* Development Mode Notice */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    <Shield className="h-4 w-4" />
                    Development Mode
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    SMTP is disabled. Use manual verification for testing.
                  </p>
                </div>
              )}
              
              {statusContent.icon}
              
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${statusContent.color}`}>
                  {statusContent.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {statusContent.description}
                </p>
              </div>

              {verificationStatus !== 'success' && verificationStatus !== 'sending' && (
                <div className="space-y-4">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full"
                    disabled={resendCooldown > 0 || !user}
                  >
                    {resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or click resend.
                  </div>
                </div>
              )}              {verificationStatus === 'success' && (
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      await logout();
                      navigate('/auth', { 
                        state: { 
                          message: 'Email verified successfully! Please sign in with your credentials.',
                          type: 'success'
                        }
                      });
                    }}
                    className="w-full"
                  >
                    Go to Sign In
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You will be automatically redirected in a few seconds
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Link 
                  to="/auth" 
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
