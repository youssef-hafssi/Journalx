import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { initializeAnalytics, trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AllTrades from "./pages/AllTrades";
import Layout from "./components/layout/Layout";
import CalendarPage from "./pages/CalendarPage";
import StatisticalEdge from "./pages/StatisticalEdge";
import JournalPage from "./pages/JournalPage";
import ForexTradableAssetsPage from "./pages/ForexTradableAssetsPage";
import OnboardingPage from "./pages/OnboardingPage";
import EdgeBuilder from "./pages/EdgeBuilder";
import NewsData from "./pages/NewsData";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrades from "./pages/admin/AdminTrades";
import AdminNotifications from "./pages/admin/AdminNotifications";
import { AdminRoute } from "./components/admin/AdminRoute";
import { ImpersonatedRoute } from "./components/admin/ImpersonatedRoute";
import { useTrades } from "@/hooks/use-trades";

const queryClient = new QueryClient();

// Analytics tracker component
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

// App routes component that uses the trades hook
const AppRoutes = () => {
  const { trades } = useTrades();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/auth/confirm" element={<EmailVerificationPage />} />
      <Route path="/auth/callback" element={<EmailVerificationPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trades" element={<AllTrades />} />
        <Route path="/calendar" element={<CalendarPage trades={trades} />} />
        <Route path="/statistical-edge" element={<StatisticalEdge trades={trades} />} />
        <Route path="/edge-builder" element={<EdgeBuilder trades={trades} />} />
        <Route path="/journal" element={<JournalPage trades={trades} />} />
        <Route path="/forex-tradable-assets" element={<ForexTradableAssetsPage />} />
        <Route path="/news-data" element={<NewsData trades={trades} />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/trades" element={<AdminRoute><AdminTrades /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />

      {/* Admin Impersonation Routes */}
      <Route element={<AdminRoute><ImpersonatedRoute><Layout /></ImpersonatedRoute></AdminRoute>}>
        <Route path="/admin/impersonate/:userId/dashboard" element={<Dashboard />} />
        <Route path="/admin/impersonate/:userId/trades" element={<AllTrades />} />
        <Route path="/admin/impersonate/:userId/calendar" element={<CalendarPage trades={trades} />} />
        <Route path="/admin/impersonate/:userId/statistical-edge" element={<StatisticalEdge trades={trades} />} />
        <Route path="/admin/impersonate/:userId/journal" element={<JournalPage trades={trades} />} />
        <Route path="/admin/impersonate/:userId/edge-builder" element={<EdgeBuilder trades={trades} />} />
        <Route path="/admin/impersonate/:userId/forex-tradable-assets" element={<ForexTradableAssetsPage />} />
        <Route path="/admin/impersonate/:userId/news-data" element={<NewsData trades={trades} />} />
      </Route>

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {

  // Initialize analytics on app mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ImpersonationProvider>
            <NotificationProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsTracker />
                <AppRoutes />
              </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </ImpersonationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
