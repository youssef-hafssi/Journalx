import { supabase } from './supabase';

export interface OnlineUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  last_seen: string;
  is_online: boolean;
}

class PresenceService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly ONLINE_THRESHOLD = 300000; // 5 minutes in milliseconds

  // Start tracking user presence
  startPresenceTracking() {
    console.log('🟢 Starting presence tracking...');
    
    // Update presence immediately
    this.updatePresence();
    
    // Set up heartbeat to update presence every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence();
    }, this.HEARTBEAT_INTERVAL);

    // Update presence when user becomes active
    this.setupActivityListeners();
  }

  // Stop tracking user presence
  stopPresenceTracking() {
    console.log('🔴 Stopping presence tracking...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Update last seen one final time
    this.updatePresence();
  }

  // Update user's last seen timestamp
  private async updatePresence() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating presence:', error);
      } else {
        console.log('📍 Presence updated');
      }
    } catch (error) {
      console.error('Error in updatePresence:', error);
    }
  }

  // Set up listeners for user activity
  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    let lastActivity = Date.now();
    const throttleDelay = 10000; // 10 seconds throttle

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > throttleDelay) {
        lastActivity = now;
        this.updatePresence();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updatePresence();
      }
    });

    // Handle beforeunload to update presence when leaving
    window.addEventListener('beforeunload', () => {
      this.updatePresence();
    });
  }

  // Get currently online users (for admin)
  async getOnlineUsers(): Promise<OnlineUser[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is admin
      const { data: adminCheck } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!adminCheck || !['dahafssi@gmail.com', 'youssefhafssi@gmail.com', 'admin@journalx.com'].includes(adminCheck.email)) {
        throw new Error('Admin access required');
      }

      // Get all users with their last seen timestamps
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url, last_seen')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // Calculate online status based on last seen
      const now = new Date().getTime();
      const onlineUsers: OnlineUser[] = (users || []).map(user => ({
        ...user,
        is_online: user.last_seen ? (now - new Date(user.last_seen).getTime()) < this.ONLINE_THRESHOLD : false
      }));

      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Subscribe to real-time presence updates
  subscribeToPresenceUpdates(callback: (users: OnlineUser[]) => void) {
    console.log('🔔 Subscribing to presence updates...');

    // Set up real-time subscription to profiles table
    const subscription = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'last_seen=neq.null'
        },
        async () => {
          // Refresh online users when any user's presence updates
          const users = await this.getOnlineUsers();
          callback(users);
        }
      )
      .subscribe();

    return subscription;
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    const users = await this.getOnlineUsers();
    return users.filter(user => user.is_online).length;
  }
}

export const presenceService = new PresenceService();
