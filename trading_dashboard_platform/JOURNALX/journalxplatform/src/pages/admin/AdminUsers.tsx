import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/lib/admin';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import type { AdminUser, AdminFilters } from '@/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Download,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  ArrowUpDown,
  UserCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState<AdminFilters['users']>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await AdminService.getUsers(filters);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field as any,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    const exportData = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      total_trades: user.trade_stats?.total_trades || 0,
      total_pnl: user.trade_stats?.total_pnl || 0,
      win_rate: user.trade_stats?.win_rate || 0,
      avg_trade_size: user.trade_stats?.avg_trade_size || 0
    }));

    AdminService.exportToCSV(exportData, `users-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Users exported successfully');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await AdminService.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleImpersonateUser = (user: AdminUser) => {
    startImpersonation(user);
    toast.success(`Now viewing as ${user.name} (${user.email})`);
    navigate(`/admin/impersonate/${user.id}/dashboard`);
  };

  const getSortIcon = (field: string) => {
    if (filters.sort_by !== field) return <ArrowUpDown className="h-4 w-4" />;
    return filters.sort_order === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor user accounts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadUsers} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                provider: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Best Trade</TableHead>
                    <TableHead>Favorite Symbol</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Joined {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('last_sign_in_at')}
                    >
                      <div className="flex items-center gap-2">
                        Last Active {getSortIcon('last_sign_in_at')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.provider || 'email'}</Badge>
                      </TableCell>
                      <TableCell>{user.trade_stats?.total_trades || 0}</TableCell>
                      <TableCell>
                        <span className={user.trade_stats?.total_pnl && user.trade_stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(user.trade_stats?.total_pnl || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.trade_stats?.win_rate ? `${user.trade_stats.win_rate.toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={user.trade_stats?.best_trade && user.trade_stats.best_trade > 0 ? 'text-green-600' : 'text-gray-500'}>
                          {user.trade_stats?.best_trade ? formatCurrency(user.trade_stats.best_trade) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {user.trade_stats?.most_traded_symbol || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={user.deleted_at ? "destructive" : user.banned_until ? "destructive" : "default"}
                            className="text-xs w-fit"
                          >
                            {user.deleted_at ? 'Deleted' : user.banned_until ? 'Banned' : 'Active'}
                          </Badge>
                          <Badge variant="outline" className="text-xs w-fit">
                            User
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleImpersonateUser(user)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Impersonate User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>Provider:</strong> {selectedUser.provider || 'email'}</div>
                    <div><strong>User ID:</strong> {selectedUser.id}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}</div>
                    <div><strong>Last Active:</strong> {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'}</div>
                    <div><strong>Email Confirmed:</strong> {selectedUser.email_confirmed_at ? 'Yes' : 'No'}</div>
                    {selectedUser.phone && <div><strong>Phone:</strong> {selectedUser.phone}</div>}
                    {selectedUser.role && <div><strong>Role:</strong> {selectedUser.role}</div>}
                    {selectedUser.is_super_admin && <div><strong>Super Admin:</strong> Yes</div>}
                    {selectedUser.banned_until && <div><strong>Banned Until:</strong> {new Date(selectedUser.banned_until).toLocaleString()}</div>}
                    {selectedUser.deleted_at && <div><strong>Deleted At:</strong> {new Date(selectedUser.deleted_at).toLocaleString()}</div>}
                  </div>
                </div>
              </div>
              
              {selectedUser.trade_stats && (
                <div>
                  <h4 className="font-medium">Trading Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Total Trades:</strong> {selectedUser.trade_stats.total_trades}</div>
                    <div><strong>Total P&L:</strong> <span className={selectedUser.trade_stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(selectedUser.trade_stats.total_pnl)}</span></div>
                    <div><strong>Win Rate:</strong> {selectedUser.trade_stats.win_rate.toFixed(1)}%</div>
                    <div><strong>Avg Trade Size:</strong> {formatCurrency(selectedUser.trade_stats.avg_trade_size)}</div>
                    <div><strong>Best Trade:</strong> <span className="text-green-600">{formatCurrency(selectedUser.trade_stats.best_trade)}</span></div>
                    <div><strong>Worst Trade:</strong> <span className="text-red-600">{formatCurrency(selectedUser.trade_stats.worst_trade)}</span></div>
                    <div><strong>Total Volume:</strong> {formatCurrency(selectedUser.trade_stats.total_volume)}</div>
                    <div><strong>Most Traded Symbol:</strong> {selectedUser.trade_stats.most_traded_symbol || '-'}</div>
                    <div><strong>Favorite Session:</strong> {selectedUser.trade_stats.favorite_session || '-'}</div>
                    <div><strong>Avg Hold Time:</strong> {selectedUser.trade_stats.avg_hold_time_minutes} minutes</div>
                    {selectedUser.trade_stats.last_trade_date && (
                      <div><strong>Last Trade:</strong> {new Date(selectedUser.trade_stats.last_trade_date).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Section */}
              {(selectedUser.raw_user_meta_data || selectedUser.raw_app_meta_data) && (
                <div>
                  <h4 className="font-medium">Additional Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedUser.raw_user_meta_data && Object.keys(selectedUser.raw_user_meta_data).length > 0 && (
                      <div>
                        <strong>User Metadata:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedUser.raw_user_meta_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedUser.raw_app_meta_data && Object.keys(selectedUser.raw_app_meta_data).length > 0 && (
                      <div>
                        <strong>App Metadata:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                          {JSON.stringify(selectedUser.raw_app_meta_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
