import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Circle, Clock } from 'lucide-react';
import { presenceService, type OnlineUser } from '@/lib/presence';
import { formatDistanceToNow } from 'date-fns';

interface OnlineUsersProps {
  className?: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ className }) => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let subscription: any = null;

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const onlineUsers = await presenceService.getOnlineUsers();
        setUsers(onlineUsers);
        setOnlineCount(onlineUsers.filter(user => user.is_online).length);
      } catch (error) {
        console.error('Error loading online users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load initial data
    loadUsers();

    // Set up real-time subscription
    subscription = presenceService.subscribeToPresenceUpdates((updatedUsers) => {
      setUsers(updatedUsers);
      setOnlineCount(updatedUsers.filter(user => user.is_online).length);
    });

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(loadUsers, 30000);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(user => user.is_online);
  const recentUsers = users.filter(user => !user.is_online).slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">User Activity</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <Circle className="w-2 h-2 mr-1 fill-current" />
            {onlineCount} Online
          </Badge>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {/* Currently Online Users */}
          {onlineUsers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center">
                <Circle className="w-3 h-3 mr-2 fill-current" />
                Currently Online ({onlineUsers.length})
              </h4>
              <div className="space-y-3">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Active Users */}
          {recentUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center">
                <Clock className="w-3 h-3 mr-2" />
                Recently Active
              </h4>
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Offline</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatLastSeen(user.last_seen)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Users Message */}
          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No user activity data available</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;
