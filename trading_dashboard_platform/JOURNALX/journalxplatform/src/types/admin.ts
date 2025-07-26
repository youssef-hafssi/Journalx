export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  raw_app_meta_data?: any;
  raw_user_meta_data?: any;
  is_super_admin?: boolean;
  role?: string;
  banned_until?: string;
  deleted_at?: string;
  // Profile data
  profile?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    provider: string;
    created_at: string;
    updated_at: string;
  };
  // Trade statistics
  trade_stats?: {
    total_trades: number;
    total_volume: number;
    total_pnl: number;
    win_rate: number;
    avg_trade_size: number;
    best_trade: number;
    worst_trade: number;
    last_trade_date?: string;
    most_traded_symbol?: string;
    favorite_session?: string;
    avg_hold_time_minutes: number;
  };
}

export interface AdminTrade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  notes?: string;
  pnl?: number;
  entry_date?: string;
  exit_date?: string;
  trade_type?: 'long' | 'short';
  session?: 'Asia' | 'London' | 'NY AM' | 'NY PM';
  timeframe?: string;
  entry_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  order_type?: 'Market' | 'Limit' | 'Stop';
  risk_per_trade?: number;
  reward_to_risk_ratio?: number;
  entry_model?: string;
  news?: any;
  mistakes_made?: string;
  lessons_learned?: string;
  trade_rating?: number;
  created_at: string;
  updated_at: string;
  // User information
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AdminStats {
  total_users: number;
  total_trades: number;
  total_volume: number;
  total_pnl: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  trades_today: number;
  trades_week: number;
  trades_month: number;
  avg_trades_per_user: number;
  top_performers: AdminUser[];
  recent_signups: AdminUser[];
  recent_trades: AdminTrade[];
}

export interface AdminFilters {
  users?: {
    search?: string;
    provider?: string;
    date_from?: string;
    date_to?: string;
    has_trades?: boolean;
    sort_by?: 'created_at' | 'last_sign_in_at' | 'email' | 'name';
    sort_order?: 'asc' | 'desc';
  };
  trades?: {
    search?: string;
    user_id?: string;
    symbol?: string;
    side?: 'buy' | 'sell';
    status?: 'open' | 'closed' | 'cancelled';
    trade_type?: 'long' | 'short';
    session?: 'Asia' | 'London' | 'NY AM' | 'NY PM';
    date_from?: string;
    date_to?: string;
    pnl_min?: number;
    pnl_max?: number;
    sort_by?: 'created_at' | 'pnl' | 'total' | 'symbol';
    sort_order?: 'asc' | 'desc';
  };
}

export interface AdminRole {
  user_id: string;
  role: 'admin' | 'super_admin' | 'user';
  granted_by: string;
  granted_at: string;
}

// Notification types
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
  notification?: AdminNotification;
}

export interface NotificationAnalytics {
  total_delivered: number;
  total_read: number;
  total_dismissed: number;
  total_pending: number;
  read_rate: number;
  dismiss_rate: number;
}
