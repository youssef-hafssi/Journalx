import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for notifications
export interface AdminNotification {
  id: string;
  admin_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_type: 'all' | 'specific' | 'role';
  target_users?: string[];
  target_roles?: string[];
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  notification_id: string;
  user_id: string;
  is_read: boolean;
  is_dismissed: boolean;
  read_at?: string;
  dismissed_at?: string;
  delivered_at: string;
  created_at: string;
  // Joined notification data
  notification?: AdminNotification;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_type?: 'all' | 'specific' | 'role';
  target_users?: string[];
  target_roles?: string[];
  expires_at?: string;
}

export class NotificationService {
  private static realtimeChannel: RealtimeChannel | null = null;

  // Admin functions - Create notifications
  static async createNotification(data: CreateNotificationData): Promise<AdminNotification> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const notificationData = {
        admin_id: user.id,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        target_type: data.target_type || 'all',
        target_users: data.target_users && data.target_users.length > 0 ? data.target_users : null,
        target_roles: data.target_roles && data.target_roles.length > 0 ? data.target_roles : null,
        expires_at: data.expires_at && data.expires_at.trim() ? data.expires_at : null,
        is_active: true
      };

      console.log('Sending notification data:', notificationData);

      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      console.log('Notification created:', notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Admin functions - Get all notifications
  static async getAdminNotifications(): Promise<AdminNotification[]> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }
  }

  // Admin functions - Update notification
  static async updateNotification(id: string, updates: Partial<AdminNotification>): Promise<AdminNotification> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  // Admin functions - Delete notification
  static async deleteNotification(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Admin functions - Get notification analytics
  static async getNotificationAnalytics(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('is_read, is_dismissed, read_at, dismissed_at')
        .eq('notification_id', notificationId);

      if (error) throw error;

      const total = data.length;
      const read = data.filter(n => n.is_read).length;
      const dismissed = data.filter(n => n.is_dismissed).length;
      const pending = total - read - dismissed;

      return {
        total_delivered: total,
        total_read: read,
        total_dismissed: dismissed,
        total_pending: pending,
        read_rate: total > 0 ? (read / total) * 100 : 0,
        dismiss_rate: total > 0 ? (dismissed / total) * 100 : 0
      };
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      throw error;
    }
  }

  // User functions - Get user notifications
  static async getUserNotifications(targetUserId?: string): Promise<UserNotification[]> {
    try {
      // If targetUserId is provided (for impersonation), use admin service to get notifications
      if (targetUserId) {
        return await this.getUserNotificationsForImpersonation(targetUserId);
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          *,
          notification:admin_notifications(*)
        `)
        .eq('is_dismissed', false) // Only get non-dismissed notifications
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Admin function - Get notifications for a specific user (for impersonation)
  static async getUserNotificationsForImpersonation(userId: string): Promise<UserNotification[]> {
    try {
      // Use admin RPC function to bypass RLS and get notifications for the impersonated user
      const { data, error } = await supabase
        .rpc('get_user_notifications_for_admin', { target_user_id: userId });

      if (error) throw error;

      // Transform the flat data structure to match UserNotification interface
      const notifications: UserNotification[] = (data || []).map((row: any) => ({
        id: row.id,
        notification_id: row.notification_id,
        user_id: row.user_id,
        is_read: row.is_read,
        is_dismissed: row.is_dismissed,
        read_at: row.read_at,
        dismissed_at: row.dismissed_at,
        delivered_at: row.delivered_at,
        created_at: row.created_at,
        notification: {
          id: row.notification_id,
          title: row.notification_title,
          message: row.notification_message,
          type: row.notification_type,
          priority: row.notification_priority,
          created_at: row.notification_created_at,
          expires_at: row.notification_expires_at,
          is_active: row.notification_is_active,
          admin_id: '', // Not needed for display
          target_type: 'all', // Default value
          target_users: null,
          target_roles: null,
          updated_at: row.notification_created_at
        }
      }));

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications for impersonation:', error);
      throw error;
    }
  }

  // User functions - Get unread notifications
  static async getUnreadNotifications(): Promise<UserNotification[]> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          *,
          notification:admin_notifications(*)
        `)
        .eq('is_read', false)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  // User functions - Get unread count
  static async getUnreadCount(targetUserId?: string): Promise<number> {
    try {
      // If targetUserId is provided (for impersonation), get count for that user
      if (targetUserId) {
        return await this.getUnreadCountForImpersonation(targetUserId);
      }

      const { data, error } = await supabase
        .rpc('get_unread_notification_count');

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Admin function - Get unread count for a specific user (for impersonation)
  static async getUnreadCountForImpersonation(userId: string): Promise<number> {
    try {
      // Use admin RPC function to bypass RLS and get unread count for the impersonated user
      const { data, error } = await supabase
        .rpc('get_unread_count_for_admin', { target_user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching unread count for impersonation:', error);
      return 0;
    }
  }

  // User functions - Mark as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('mark_notification_read', { notification_id: notificationId });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // User functions - Dismiss notification
  static async dismissNotification(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('dismiss_notification', { notification_id: notificationId });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }

  // Real-time subscriptions
  static subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: UserNotification) => void,
    onUpdate: (notification: UserNotification) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('New notification received:', payload);
          
          // Fetch the complete notification with admin_notification data
          const { data } = await supabase
            .from('user_notifications')
            .select(`
              *,
              notification:admin_notifications(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNotification(data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Notification updated:', payload);
          
          // Fetch the complete notification with admin_notification data
          const { data } = await supabase
            .from('user_notifications')
            .select(`
              *,
              notification:admin_notifications(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onUpdate(data);
          }
        }
      )
      .subscribe();

    this.realtimeChannel = channel;
    return channel;
  }

  // Unsubscribe from real-time updates
  static unsubscribeFromNotifications(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  // Utility function to format notification for display
  static formatNotificationForDisplay(notification: UserNotification): {
    title: string;
    message: string;
    type: string;
    priority: string;
    timestamp: string;
    isUrgent: boolean;
  } {
    const adminNotification = notification.notification;
    if (!adminNotification) {
      return {
        title: 'Notification',
        message: 'No content available',
        type: 'info',
        priority: 'low',
        timestamp: notification.created_at,
        isUrgent: false
      };
    }

    return {
      title: adminNotification.title,
      message: adminNotification.message,
      type: adminNotification.type,
      priority: adminNotification.priority,
      timestamp: notification.created_at,
      isUrgent: adminNotification.priority === 'urgent'
    };
  }
}
