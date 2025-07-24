import React, { useState, useEffect } from 'react';
import { AdminService } from '@/lib/admin';
import type { AdminTrade, AdminFilters } from '@/types/admin';
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
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Search, 
  Download, 
  Filter,
  MoreHorizontal,
  Eye,
  Loader2,
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminTrades() {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<AdminTrade | null>(null);
  const [filters, setFilters] = useState<AdminFilters['trades']>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  useEffect(() => {
    loadTrades();
  }, [filters]);

  const loadTrades = async () => {
    try {
      setIsLoading(true);
      const data = await AdminService.getTrades(filters);
      setTrades(data);
    } catch (error) {
      console.error('Error loading trades:', error);
      toast.error('Failed to load trades');
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
    const exportData = trades.map(trade => ({
      id: trade.id,
      user_email: trade.user?.email,
      user_name: trade.user?.name,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      total: trade.total,
      fee: trade.fee,
      pnl: trade.pnl,
      status: trade.status,
      trade_type: trade.trade_type,
      session: trade.session,
      entry_date: trade.entry_date,
      exit_date: trade.exit_date,
      created_at: trade.created_at,
      notes: trade.notes
    }));

    AdminService.exportToCSV(exportData, `trades-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Trades exported successfully');
  };

  const getSortIcon = (field: string) => {
    if (filters.sort_by !== field) return <ArrowUpDown className="h-4 w-4" />;
    return filters.sort_order === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      closed: 'secondary',
      cancelled: 'destructive'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const getSideBadge = (side: string) => {
    return (
      <Badge variant={side === 'buy' ? 'default' : 'secondary'}>
        {side.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade Management</h2>
          <p className="text-muted-foreground">
            Monitor and analyze all trading activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadTrades} variant="outline" size="sm">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbol or notes..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select
              value={filters.side || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                side: value === 'all' ? undefined : value as 'buy' | 'sell'
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                status: value === 'all' ? undefined : value as 'open' | 'closed' | 'cancelled'
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.session || 'all'}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                session: value === 'all' ? undefined : value as any
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="London">London</SelectItem>
                <SelectItem value="NY AM">NY AM</SelectItem>
                <SelectItem value="NY PM">NY PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trades ({trades.length})
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
                    <TableHead>User</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center gap-2">
                        Symbol {getSortIcon('symbol')}
                      </div>
                    </TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center gap-2">
                        Total {getSortIcon('total')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('pnl')}
                    >
                      <div className="flex items-center gap-2">
                        P&L {getSortIcon('pnl')}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Date {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trade.user?.name}</div>
                          <div className="text-xs text-muted-foreground">{trade.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>{getSideBadge(trade.side)}</TableCell>
                      <TableCell>{formatNumber(trade.quantity)}</TableCell>
                      <TableCell>{formatCurrency(trade.total)}</TableCell>
                      <TableCell>
                        {trade.pnl !== null ? (
                          <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell>
                        {trade.session ? (
                          <Badge variant="outline">{trade.session}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(trade.created_at).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => setSelectedTrade(trade)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
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

      {/* Trade Details Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
            <DialogDescription>
              Detailed information about this trade
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Trade ID:</strong> {selectedTrade.id}</div>
                    <div><strong>User:</strong> {selectedTrade.user?.name} ({selectedTrade.user?.email})</div>
                    <div><strong>Symbol:</strong> {selectedTrade.symbol}</div>
                    <div><strong>Side:</strong> {selectedTrade.side.toUpperCase()}</div>
                    <div><strong>Status:</strong> {selectedTrade.status}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Trade Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Quantity:</strong> {formatNumber(selectedTrade.quantity)}</div>
                    <div><strong>Price:</strong> {formatCurrency(selectedTrade.price)}</div>
                    <div><strong>Total:</strong> {formatCurrency(selectedTrade.total)}</div>
                    <div><strong>Fee:</strong> {formatCurrency(selectedTrade.fee)}</div>
                    <div><strong>P&L:</strong> {selectedTrade.pnl !== null ? formatCurrency(selectedTrade.pnl) : 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {(selectedTrade.trade_type || selectedTrade.session || selectedTrade.timeframe) && (
                <div>
                  <h4 className="font-medium">Trading Context</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Trade Type:</strong> {selectedTrade.trade_type || 'N/A'}</div>
                    <div><strong>Session:</strong> {selectedTrade.session || 'N/A'}</div>
                    <div><strong>Timeframe:</strong> {selectedTrade.timeframe || 'N/A'}</div>
                    <div><strong>Order Type:</strong> {selectedTrade.order_type || 'N/A'}</div>
                  </div>
                </div>
              )}

              {(selectedTrade.entry_price || selectedTrade.exit_price || selectedTrade.stop_loss || selectedTrade.take_profit) && (
                <div>
                  <h4 className="font-medium">Price Levels</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Entry Price:</strong> {selectedTrade.entry_price ? formatCurrency(selectedTrade.entry_price) : 'N/A'}</div>
                    <div><strong>Exit Price:</strong> {selectedTrade.exit_price ? formatCurrency(selectedTrade.exit_price) : 'N/A'}</div>
                    <div><strong>Stop Loss:</strong> {selectedTrade.stop_loss ? formatCurrency(selectedTrade.stop_loss) : 'N/A'}</div>
                    <div><strong>Take Profit:</strong> {selectedTrade.take_profit ? formatCurrency(selectedTrade.take_profit) : 'N/A'}</div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium">Timestamps</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Created:</strong> {new Date(selectedTrade.created_at).toLocaleString()}</div>
                  <div><strong>Updated:</strong> {new Date(selectedTrade.updated_at).toLocaleString()}</div>
                  <div><strong>Entry Date:</strong> {selectedTrade.entry_date ? new Date(selectedTrade.entry_date).toLocaleString() : 'N/A'}</div>
                  <div><strong>Exit Date:</strong> {selectedTrade.exit_date ? new Date(selectedTrade.exit_date).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              {selectedTrade.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm bg-muted p-2 rounded">{selectedTrade.notes}</p>
                </div>
              )}

              {(selectedTrade.mistakes_made || selectedTrade.lessons_learned) && (
                <div>
                  <h4 className="font-medium">Learning</h4>
                  <div className="space-y-2 text-sm">
                    {selectedTrade.mistakes_made && (
                      <div>
                        <strong>Mistakes Made:</strong>
                        <p className="bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1">{selectedTrade.mistakes_made}</p>
                      </div>
                    )}
                    {selectedTrade.lessons_learned && (
                      <div>
                        <strong>Lessons Learned:</strong>
                        <p className="bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1">{selectedTrade.lessons_learned}</p>
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
