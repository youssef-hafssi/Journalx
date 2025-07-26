import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminService } from '@/lib/admin';
import type { AdminStats } from '@/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  UserPlus,
  Loader2,
  Bell
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import OnlineUsers from '@/components/admin/OnlineUsers';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AdminService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading admin stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={loadStats} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.total_users),
      description: `+${stats.new_users_month} this month`,
      icon: Users,
      trend: stats.new_users_month > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Total Trades',
      value: formatNumber(stats.total_trades),
      description: `+${stats.trades_month} this month`,
      icon: TrendingUp,
      trend: stats.trades_month > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Total Volume',
      value: formatCurrency(stats.total_volume),
      description: `Avg ${formatCurrency(stats.avg_trades_per_user)} per user`,
      icon: DollarSign,
      trend: 'neutral'
    },
    {
      title: 'Total P&L',
      value: formatCurrency(stats.total_pnl),
      description: stats.total_pnl >= 0 ? 'Profitable' : 'Loss',
      icon: Activity,
      trend: stats.total_pnl >= 0 ? 'up' : 'down'
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your JournalX platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStats} variant="outline" size="sm">
            Refresh
          </Button>
          <Button asChild>
            <Link to="/admin/users">Manage Users</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />}
                  {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Online Users */}
            <OnlineUsers className="md:col-span-1" />
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Users:</span>
                  <span className="font-medium">{stats.new_users_today}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trades:</span>
                  <span className="font-medium">{stats.trades_today}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Users:</span>
                  <span className="font-medium">{stats.new_users_week}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trades:</span>
                  <span className="font-medium">{stats.trades_week}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Users:</span>
                  <span className="font-medium">{stats.new_users_month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trades:</span>
                  <span className="font-medium">{stats.trades_month}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
                <CardDescription>Users with highest P&L</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.top_performers.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(user.trade_stats?.total_pnl || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.trade_stats?.total_trades || 0} trades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Signups */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Signups</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recent_signups.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {user.provider || 'email'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Trades</CardTitle>
              <CardDescription>Latest trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recent_trades.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={trade.trade_type === 'long' || trade.side === 'buy' ? 'default' : 'secondary'}>
                        {(trade.trade_type || trade.side || 'trade').toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {trade.user?.name} • {new Date(trade.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(trade.total)}
                      </p>
                      {trade.pnl !== null && (
                        <p className={`text-xs ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/admin/users">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Users</CardTitle>
              <Users className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View, search, and manage user accounts
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/admin/trades">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View All Trades</CardTitle>
              <BarChart3 className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Analyze trading activity and performance
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/admin/notifications">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Send Notifications</CardTitle>
              <Bell className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Send popup messages to users
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <Activity className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Detailed platform analytics and insights
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
