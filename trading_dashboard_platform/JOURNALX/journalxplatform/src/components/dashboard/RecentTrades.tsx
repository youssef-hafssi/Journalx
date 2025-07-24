
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  pnl: number;
  entryDate?: Date;
  exitDate?: Date;
  tradeType?: 'long' | 'short';
  session?: 'Asia' | 'London' | 'NY AM' | 'NY PM';
  timeframe?: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  orderType?: 'Market' | 'Limit' | 'Stop';
  riskPerTrade?: number;
  rewardToRiskRatio?: number;
  entryModel?: string;
  news?: { type?: 'red' | 'orange' | 'yellow' | 'grey' | 'no-news'; name?: string; time?: string; }[];
  mistakesMade?: string;
  lessonsLearned?: string;
  tradeRating?: number;
}

const RecentTrades = ({ trades = [] }: { trades: Trade[] }) => {
  const getTradeTypeIcon = (tradeType?: string) => {
    if (tradeType === 'long') return <TrendingUp className="h-3 w-3" />;
    if (tradeType === 'short') return <TrendingDown className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  const getSessionColor = (session?: string) => {
    switch (session) {
      case 'Asia': return 'bg-gray-100 text-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200';
      case 'London': return 'bg-purple-100 text-purple-800 dark:bg-[#1a1a1a] dark:text-purple-200';
      case 'NY AM': return 'bg-orange-100 text-orange-800 dark:bg-[#1a1a1a] dark:text-orange-200';
      case 'NY PM': return 'bg-green-100 text-green-800 dark:bg-[#1a1a1a] dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-card/90 border-border/60 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
            <Activity className="h-5 w-5 text-black dark:text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Trade History</CardTitle>
            <p className="text-sm text-muted-foreground">Recent trading activity</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="recent" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Recent Trades
            </TabsTrigger>
            <TabsTrigger value="open" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Open Positions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            <div className="rounded-lg border border-border/50 overflow-hidden bg-background/50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Symbol</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Session</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 8).map((trade, index) => (
                    <TableRow 
                      key={trade.id} 
                      className="hover:bg-muted/30 transition-colors duration-200 border-border/30"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{trade.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {trade.symbol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTradeTypeIcon(trade.tradeType)}
                          <span className={cn(
                            "text-xs font-medium capitalize",
                            trade.tradeType === 'long' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {trade.tradeType || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {trade.session && (
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getSessionColor(trade.session))}
                          >
                            {trade.session}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "font-bold text-sm flex items-center justify-end gap-1",
                          trade.pnl >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        )}>
                          {trade.pnl >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {trades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No trades recorded yet. Start by adding your first trade!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="open" className="py-8">
            <div className="text-center space-y-3">
              <div className="mx-auto p-3 bg-muted/30 rounded-full w-fit">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No open positions.</p>
              <p className="text-sm text-muted-foreground/80">
                Your active trades will appear here when you have open positions.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default RecentTrades;
