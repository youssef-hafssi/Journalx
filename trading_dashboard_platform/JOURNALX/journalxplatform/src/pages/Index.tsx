import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Star, ChartLine, TrendingUp, BarChart3, Target, Shield, Zap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const reviews = [
  {
    name: "Alex D.",
    role: "Day Trader",
    review: "JournalX has transformed my trading. The analytics are top-notch and have helped me identify my edge. A must-have for any serious trader.",
    avatar: "https://i.pravatar.cc/150?u=alexd",
    rating: 5,
  },
  {
    name: "Samantha P.",
    role: "Swing Trader",
    review: "I've tried many journaling platforms, but JournalX is by far the most intuitive and powerful. The calendar view is a game changer for me.",
    avatar: "https://i.pravatar.cc/150?u=samanthap",
    rating: 5,
  },
  {
    name: "Michael B.",
    role: "Algo Trader",
    review: "The ability to tag and filter trades is incredibly useful. It's helped me refine my strategies and improve my P&L significantly.",
    avatar: "https://i.pravatar.cc/150?u=michaelb",
    rating: 5,
  },
  {
    name: "Sarah L.",
    role: "Options Trader",
    review: "The risk management tools are fantastic. I can see exactly where my weaknesses are and work on improving them. Highly recommended!",
    avatar: "https://i.pravatar.cc/150?u=sarahl",
    rating: 5,
  },
  {
    name: "David Chen",
    role: "Forex Trader",
    review: "JournalX's statistical analysis helped me increase my win rate by 15%. The psychological metrics feature is particularly valuable.",
    avatar: "https://i.pravatar.cc/150?u=davidchen",
    rating: 5,
  },
  {
    name: "Emma K.",
    role: "Futures Trader",
    review: "Clean interface, powerful analytics, and excellent customer support. This platform has everything a professional trader needs.",
    avatar: "https://i.pravatar.cc/150?u=emmak",
    rating: 5,
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive performance metrics and detailed insights into your trading patterns."
  },
  {
    icon: Target,
    title: "Statistical Edge",
    description: "Identify your statistical advantages and optimize your trading strategies."
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Monitor and control your risk exposure with advanced risk management tools."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "Track trades in real-time with instant performance updates and notifications."
  }
];

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // All hooks must be called at the top level before any conditional returns
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Handle window resize for responsive carousel
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create a continuous scrolling effect with looping
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prevIndex) => {
          // When we reach the end, reset to 0 for seamless loop
          if (prevIndex >= reviews.length - 1) {
            return 0;
          }
          return prevIndex + 1;
        });
      }, 3000); // Change review every 3 seconds for faster scrolling
      
      return () => clearInterval(interval);
    }
  }, [isPaused]);
  
  // Create continuous scrolling effect
  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (!isPaused) {
      const scrollSpeed = 0.5; // pixels per frame
      
      function scroll() {
        setScrollPosition(prev => {
          // When we've scrolled the width of one card, reset to create loop effect
          if (prev >= 100 / reviews.length) {
            return 0;
          }
          return prev + scrollSpeed * 0.01;
        });
        animationRef.current = requestAnimationFrame(scroll);
      }
      
      animationRef.current = requestAnimationFrame(scroll);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }  }, [isPaused, reviews.length]);
  
  // Cleanup all animations and timers on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, []);
  
  // Redirect to dashboard if already authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }  if (isAuthenticated) {
    // Check if this user just verified their email
    const emailVerifiedNewUser = localStorage.getItem('journalx_email_verified_new_user');
    
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('journalx_onboarding_completed');
    
    console.log('🏠 Index page - Authenticated user detected');
    console.log('🏠 Email verified new user:', emailVerifiedNewUser);
    console.log('🏠 Onboarding completed:', onboardingCompleted);
    
    if (emailVerifiedNewUser === 'true' && onboardingCompleted !== 'true') {
      // User just verified email - redirect to onboarding and clear the flag
      console.log('🎯 REDIRECTING TO ONBOARDING - New user from email verification');
      localStorage.removeItem('journalx_email_verified_new_user');
      return <Navigate to="/onboarding" replace />;
    }
    
    if (onboardingCompleted === 'true') {
      console.log('🎯 REDIRECTING TO DASHBOARD - Onboarding completed');
      return <Navigate to="/dashboard" replace />;
    } else {
      // New user - redirect to onboarding
      console.log('🎯 REDIRECTING TO ONBOARDING - New user (no onboarding completed)');
      return <Navigate to="/onboarding" replace />;
    }
  }
  
  const reviewWidth = 220; // Width of each review card in pixels
    // Show multiple reviews that continuously scroll
  const itemsPerView = 4; // Show at least 4 items at once
  
  // Functions to handle arrow button navigation
  const handleScrollLeft = () => {
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsPaused(true);
    
    setScrollPosition(prev => {
      // Calculate the amount to scroll (equal to one review card)
      const scrollAmount = 100 / reviews.length;
      let newPosition = prev - scrollAmount;
      
      // Handle loop wrapping when scrolling left
      if (newPosition < 0) {
        newPosition = scrollAmount * (reviews.length - 1);
      }
      
      return newPosition;
    });
    
    // Clear any existing timers
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    
    // Resume auto-scrolling after a delay
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000);
  };
  
  const handleScrollRight = () => {
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsPaused(true);
    
    setScrollPosition(prev => {
      // Calculate the amount to scroll (equal to one review card)
      const scrollAmount = 100 / reviews.length;
      let newPosition = prev + scrollAmount;
      
      // Handle loop wrapping when scrolling right
      if (newPosition >= scrollAmount * reviews.length) {
        newPosition = 0;
      }
      
      return newPosition;
    });
    
    // Clear any existing timers
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
      // Resume auto-scrolling after a delay
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000);
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] relative overflow-hidden">
      {/* White Galaxy Background with Grain */}
      <div className="absolute inset-0">
        {/* Grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
        
        {/* Galaxy effect with multiple layers */}
        <div className="absolute inset-0">
          {/* Main galaxy center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 dark:opacity-10">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgb(209 213 219) 0%, rgb(243 244 246) 40%, transparent 70%)'
              }}
            ></div>
          </div>
          
          {/* Secondary galaxy layers */}
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] opacity-15 dark:opacity-8">
            <div 
              className="w-full h-full rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgb(229 231 235) 0%, rgb(249 250 251) 50%, transparent 80%)'
              }}
            ></div>
          </div>
          
          <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] opacity-10 dark:opacity-5">
            <div 
              className="w-full h-full rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgb(219 234 254) 0%, rgb(243 244 246) 45%, transparent 75%)'
              }}
            ></div>
          </div>
          
          {/* Scattered star-like points */}
          <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute top-[60%] right-[20%] w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-50"></div>
          <div className="absolute bottom-[30%] left-[70%] w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-[40%] left-[80%] w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-40"></div>
          <div className="absolute bottom-[70%] right-[60%] w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-[80%] left-[40%] w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-50"></div>
          <div className="absolute bottom-[40%] right-[80%] w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30"></div>
          <div className="absolute top-[15%] right-[40%] w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-40 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <BarChart3 className="h-6 w-6 text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Journal<span className="text-red-600">X</span></h1>
          <Badge variant="secondary" className="text-xs">Pro</Badge>
        </div>        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/auth" className="text-sm font-medium hover:text-black dark:hover:text-white transition-colors text-gray-700 dark:text-gray-300">
            Log In
          </Link>
          <Button asChild size="default" className="shadow-lg hover:shadow-xl transition-all duration-300 bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black">
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-32">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Master Your Trading Performance
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed animate-slide-up" style={{ animationDelay: '0.4s' }}>
                Transform your trading with advanced analytics, comprehensive journaling, and statistical edge analysis. 
                Stop guessing, start winning with data-driven insights.
              </p>
            </div>
              <div className="flex justify-center items-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" asChild className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black px-12 py-6 text-lg">
                <Link to="/auth">Start</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ Active Traders</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-slide-up">
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Everything You Need to Succeed
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful tools designed by traders, for traders. Take your performance to the next level.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="bg-gradient-to-br from-card via-card to-card/90 border-border/60 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105 animate-bounce-in group" 
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto p-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-black dark:text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>        {/* Testimonials Section */}
        <section className="bg-muted/50 dark:bg-[#1a1a1a] py-20 sm:py-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-slide-up">
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground dark:text-white">
                Trusted by Professional Traders
              </h3>
              <p className="text-lg text-muted-foreground dark:text-gray-400">
                Join thousands of successful traders who've transformed their performance with JournalX.
              </p>
            </div>{/* Carousel Container */}
            <div className="relative max-w-full mx-auto px-2"
                 onMouseEnter={() => setIsPaused(true)}
                 onMouseLeave={() => setIsPaused(false)}>
              {/* Left Arrow Navigation */}              <button 
                onClick={handleScrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/70 dark:bg-gray-700/70 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-full p-2 shadow-lg"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              {/* Right Arrow Navigation */}
              <button 
                onClick={handleScrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/70 dark:bg-gray-700/70 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-full p-2 shadow-lg"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="overflow-hidden">
                <div 
                  ref={carouselRef}
                  className="flex transition-transform"
                  style={{ 
                    transform: `translateX(-${scrollPosition}%)`,
                    willChange: 'transform',
                    transition: 'transform 0.3s ease-in-out',
                  }}
                >
                  {/* Tripling the reviews array to create an infinite scrolling effect */}
                  {[...reviews, ...reviews, ...reviews].map((review, index) => (                    <div key={`${review.name}-${index}`} className="w-[220px] flex-shrink-0 px-2">
                      <Card 
                        className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl aspect-square flex flex-col" 
                      >
                        <CardHeader className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.avatar} alt={review.name} />
                              <AvatarFallback className="bg-muted dark:bg-gray-800 text-foreground dark:text-white font-semibold text-xs">
                                {review.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-sm text-foreground dark:text-white">{review.name}</CardTitle>
                              <p className="text-xs text-muted-foreground dark:text-gray-400">{review.role}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 flex-grow flex flex-col justify-between p-3">
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          <p className="text-muted-foreground dark:text-gray-400 leading-relaxed text-xs line-clamp-5">{review.review}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}                </div>
              </div>
              {/* No indicators for continuous scrolling */}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border/50">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <BarChart3 className="h-5 w-5 text-black dark:text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Journal<span className="text-red-600">X</span></span>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect with Us</h3>
            <div className="flex items-center justify-center gap-6">
              <a
                href="https://www.instagram.com/yussefousf/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="font-medium">Instagram</span>
              </a>

              <a
                href="https://x.com/TraderHafssi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium">Twitter/X</span>
              </a>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Journal<span className="text-red-600">X</span>. All rights reserved. Empowering traders worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
