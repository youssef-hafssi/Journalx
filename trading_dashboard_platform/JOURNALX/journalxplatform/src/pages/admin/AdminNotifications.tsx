import React, { useState, useEffect } from 'react';
import { NotificationService, type AdminNotification, type CreateNotificationData } from '@/lib/notifications';
import { AdminService, type AdminUser } from '@/lib/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Send, 
  Users, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Megaphone,
  Eye,
  Trash2,
  Plus,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    target_type: 'all',
    target_users: [],
    expires_at: ''
  });

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await NotificationService.getAdminNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Don't show error toast on initial load if table doesn't exist yet
      if (!error.message?.includes('relation "admin_notifications" does not exist')) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await AdminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.target_type === 'specific' && (!formData.target_users || formData.target_users.length === 0)) {
      toast.error('Please select at least one user for specific targeting');
      return;
    }

    try {
      setIsCreating(true);
      await NotificationService.createNotification(formData);
      toast.success('Notification sent successfully!');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        target_type: 'all',
        target_users: [],
        expires_at: ''
      });
      loadNotifications();
    } catch (error: any) {
      console.error('Error creating notification:', error);

      // More specific error messages
      if (error.message?.includes('relation "admin_notifications" does not exist')) {
        toast.error('Database tables not set up. Please run the SQL schema first.');
      } else if (error.message?.includes('permission denied')) {
        toast.error('Permission denied. Make sure you have admin access.');
      } else if (error.message?.includes('violates check constraint')) {
        toast.error('Invalid data format. Please check your inputs.');
      } else {
        toast.error(`Failed to send notification: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (notification: AdminNotification) => {
    try {
      await NotificationService.updateNotification(notification.id, {
        is_active: !notification.is_active
      });
      toast.success(`Notification ${notification.is_active ? 'deactivated' : 'activated'}`);
      loadNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleDeleteNotification = async (notification: AdminNotification) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await NotificationService.deleteNotification(notification.id);
      toast.success('Notification deleted');
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const loadAnalytics = async (notification: AdminNotification) => {
    try {
      const data = await NotificationService.getNotificationAnalytics(notification.id);
      setAnalytics(data);
      setSelectedNotification(notification);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'announcement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Send and manage notifications to users
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send New Notification</DialogTitle>
              <DialogDescription>
                Create and send a notification to users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Audience</Label>
                <Select value={formData.target_type} onValueChange={(value: any) => setFormData({ ...formData, target_type: value, target_users: [] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_type === 'specific' && (
                <div className="space-y-2">
                  <Label htmlFor="users">Select Users</Label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={formData.target_users?.includes(user.id) || false}
                          onChange={(e) => {
                            const currentUsers = formData.target_users || [];
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                target_users: [...currentUsers, user.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                target_users: currentUsers.filter(id => id !== user.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.target_users && formData.target_users.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.target_users.length} user(s) selected
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNotification} disabled={isCreating}>
                  {isCreating ? 'Sending...' : 'Send Notification'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications sent yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(notification.type)}
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      {!notification.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      {notification.expires_at && (
                        <span className="ml-2">
                          • Expires {formatDistanceToNow(new Date(notification.expires_at), { addSuffix: true })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAnalytics(notification)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={notification.is_active}
                      onCheckedChange={() => handleToggleActive(notification)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>Target: {notification.target_type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {notification.target_type === 'all' 
                        ? 'All users' 
                        : `${notification.target_users?.length || 0} users`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Analytics Dialog */}
      {selectedNotification && analytics && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notification Analytics</DialogTitle>
              <DialogDescription>
                {selectedNotification.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.total_delivered}</div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.total_read}</div>
                  <div className="text-sm text-muted-foreground">Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analytics.total_dismissed}</div>
                  <div className="text-sm text-muted-foreground">Dismissed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analytics.total_pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Read Rate:</span>
                  <span>{analytics.read_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Dismiss Rate:</span>
                  <span>{analytics.dismiss_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
