import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService, type UserNotification } from '@/lib/notifications';
import { NotificationContainer } from '@/components/notifications/NotificationToast';
import { AdminService } from '@/lib/admin';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useImpersonation } from './ImpersonationContext';
import { useParams } from 'react-router-dom';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const { userId } = useParams<{ userId: string }>();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<UserNotification[]>([]);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('🔔 NotificationContext useEffect triggered:', {
      isAuthenticated,
      user: user?.id,
      isImpersonating,
      impersonatedUser: impersonatedUser?.id,
      userId
    });

    if (isAuthenticated && (user || (isImpersonating && userId))) {
      console.log('🔔 User authenticated, loading notifications...');

      // Check if user is admin
      AdminService.isAdmin().then(adminStatus => {
        console.log('🔔 Admin status:', adminStatus);
        setIsAdmin(adminStatus);
      });

      loadNotifications();
      loadUnreadCount();
      setupRealtimeSubscription();
    } else {
      console.log('🔔 User not authenticated, clearing notifications...');
      setNotifications([]);
      setUnreadCount(0);
      setToastNotifications([]);
      setIsAdmin(false);
      if (realtimeChannel) {
        NotificationService.unsubscribeFromNotifications();
        setRealtimeChannel(null);
      }
    }

    return () => {
      if (realtimeChannel) {
        NotificationService.unsubscribeFromNotifications();
      }
    };
  }, [isAuthenticated, user, isImpersonating, userId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);

      // Determine which user's notifications to load
      const targetUserId = isImpersonating && userId ? userId : undefined;
      const displayUserId = targetUserId || user?.id;

      console.log('🔔 Loading notifications for user:', displayUserId, { isImpersonating, targetUserId });

      const data = await NotificationService.getUserNotifications(targetUserId);
      console.log('🔔 Loaded notifications:', data);
      setNotifications(data);

      // Show unread notifications as toasts when first loading (but not for impersonated users)
      if (!isImpersonating) {
        const unreadNotifications = data.filter(n => !n.is_read && !n.is_dismissed);
        console.log('🔔 Unread notifications to show as toasts:', unreadNotifications);

        if (unreadNotifications.length > 0) {
          console.log('🔔 Setting toast notifications:', unreadNotifications);
          setToastNotifications(unreadNotifications);
        }
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      // Determine which user's unread count to load
      const targetUserId = isImpersonating && userId ? userId : undefined;
      const displayUserId = targetUserId || user?.id;

      console.log('🔔 Loading unread count for user:', displayUserId, { isImpersonating, targetUserId });
      const count = await NotificationService.getUnreadCount(targetUserId);
      console.log('🔔 Unread count:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Determine which user to subscribe to
    const targetUserId = isImpersonating && userId ? userId : user?.id;

    if (!targetUserId) {
      console.log('❌ No user found for realtime subscription');
      return;
    }

    console.log('🔔 Setting up realtime subscription for user:', targetUserId, { isImpersonating });
    const channel = NotificationService.subscribeToUserNotifications(
      targetUserId,
      (newNotification) => {
        console.log('🔔 New notification received:', newNotification);

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);

        // Show as toast if not read and not impersonating
        if (!newNotification.is_read && !isImpersonating) {
          console.log('🔔 Showing toast notification');
          setToastNotifications(prev => [...prev, newNotification]);
          setUnreadCount(prev => prev + 1);
        } else if (!newNotification.is_read && isImpersonating) {
          // Just update the count for impersonated users
          setUnreadCount(prev => prev + 1);
        }
      },
      (updatedNotification) => {
        console.log('Notification updated:', updatedNotification);
        
        // Update notifications list
        setNotifications(prev =>
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        
        // Update toast notifications
        setToastNotifications(prev =>
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        
        // Update unread count if read status changed
        if (updatedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    );

    setRealtimeChannel(channel);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.notification?.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        
        // Update toast notifications
        setToastNotifications(prev =>
          prev.map(n =>
            n.notification?.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      console.log('🗑️ Dismissing notification:', notificationId);
      const success = await NotificationService.dismissNotification(notificationId);
      console.log('🗑️ Dismiss result:', success);

      if (success) {
        // Update local state to mark as dismissed instead of removing
        setNotifications(prev =>
          prev.map(n =>
            n.notification?.id === notificationId
              ? { ...n, is_dismissed: true, dismissed_at: new Date().toISOString() }
              : n
          )
        );

        // Remove from toast notifications
        setToastNotifications(prev => prev.filter(n => n.notification?.id !== notificationId));

        // Update unread count if it was unread
        const notification = notifications.find(n => n.notification?.id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
      throw error;
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
    await loadUnreadCount();
  };

  const handleToastDismiss = (toastId: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== toastId));
  };

  const handleToastRead = (toastId: string) => {
    setToastNotifications(prev =>
      prev.map(n =>
        n.id === toastId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    dismissNotification,
    refreshNotifications,
  };

  console.log('🔔 NotificationProvider rendering with toastNotifications:', toastNotifications);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast notifications container - disabled for admin users */}
      {!isAdmin && (
        <NotificationContainer
          notifications={toastNotifications.filter(n => !n.is_dismissed)}
          onDismiss={handleToastDismiss}
          onRead={handleToastRead}
        />
      )}
    </NotificationContext.Provider>
  );
}
