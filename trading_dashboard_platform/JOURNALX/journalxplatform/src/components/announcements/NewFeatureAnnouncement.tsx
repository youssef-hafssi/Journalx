import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Shield, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import React from "react";

// Custom DialogContent without the close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = "CustomDialogContent";

export const NewFeatureAnnouncement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAnnouncementStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has seen this specific announcement
        const { data, error } = await supabase
          .from('user_announcements')
          .select('*')
          .eq('user_id', user.id)
          .eq('announcement_id', 'assets-analyzer-launch')
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error checking announcement status:', error);
          setIsLoading(false);
          return;
        }

        // If no record found, user hasn't seen the announcement
        if (!data) {
          // Small delay to ensure smooth login experience
          const timer = setTimeout(() => {
            setIsOpen(true);
            setIsLoading(false);
          }, 1500);

          return () => clearTimeout(timer);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking announcement:', error);
        setIsLoading(false);
      }
    };

    checkAnnouncementStatus();
  }, [user]);

  const markAnnouncementAsSeen = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_announcements')
        .insert({
          user_id: user.id,
          announcement_id: 'assets-analyzer-launch',
          seen_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error marking announcement as seen:', error);
      }
    } catch (error) {
      console.error('Error saving announcement status:', error);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
    await markAnnouncementAsSeen();
  };

  const handleExploreNow = async () => {
    await markAnnouncementAsSeen();
    setIsOpen(false);
    // Navigate to the new page
    window.location.href = '/forex-tradable-assets';
  };

  if (!user || isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <CustomDialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                🎉 New Feature: JournalX Assets Analyzer
              </DialogTitle>
              <Badge variant="secondary" className="mt-1">
                Just Released
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Discover Tradable Currency Pairs with Professional Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              Set market conditions for each currency and instantly identify the most promising trading opportunities
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Smart Pair Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Analyze 28 major currency pairs instantly with color-coded tradability indicators
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Professional Guidelines</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Built-in risk management principles and trading best practices
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Real-time Updates</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Instant analysis as you adjust market conditions for each currency
              </p>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <h4 className="font-semibold">8 Major Currencies</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                USD, EUR, GBP, JPY, AUD, CAD, CHF, NZD with 5 market conditions each
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                  Professional Trading Tool
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This analyzer is designed as a <strong>supporting tool only</strong>. Always combine with comprehensive market analysis and proper risk management.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleExploreNow} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Explore Assets Analyzer
            </Button>
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};
