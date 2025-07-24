import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TextAnimate } from '@/components/ui/text-animate';
import { NumberTicker } from '@/components/ui/number-ticker';

interface CumulativePnlChartProps {
  data: { name: string; pnl: number }[];
}

const CumulativePnlChart = ({ data }: CumulativePnlChartProps) => {
  const currentPnl = data && data.length > 0 ? data[data.length - 1]?.pnl : 0;
  const isPositive = currentPnl >= 0;
    if (!data || data.length === 0) {    return (
      <Card className="h-full bg-[#1a1a1a] border-gray-800 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <BarChart className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-1">
                <TextAnimate 
                  animation="slideRight" 
                  className="text-lg font-semibold tracking-tight text-gray-200"
                  by="word"
                  once
                  as="h3"
                >
                  Cumulative P&L
                </TextAnimate>
                <p className="text-sm text-muted-foreground">Performance over time</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-3">
            <BarChart className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div className="space-y-1">
              <p className="text-lg font-medium text-muted-foreground">No trading data available</p>
              <p className="text-sm text-muted-foreground/70">Add your first trade to see cumulative performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }  return (
    <Card className="h-full bg-[#1a1a1a] border-gray-800 shadow-sm">
      <CardHeader className="pb-6"><div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <TextAnimate 
                animation="slideRight" 
                className="text-lg font-semibold tracking-tight text-gray-200"
                by="word"
                once
                as="h3"
              >
                Cumulative P&L
              </TextAnimate>
              <p className="text-sm text-gray-400">Performance over time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isPositive ? "default" : "destructive"} className="px-3 py-1">
              <TrendingUp className={`h-3 w-3 mr-1 ${isPositive ? '' : 'rotate-180'}`} />
              $<NumberTicker 
                value={Math.abs(currentPnl)} 
                className="font-medium"
                decimalPlaces={2}
              />
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isPositive ? "#ffffff" : "#f87171"} 
                    stopOpacity={0.8}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isPositive ? "#ffffff" : "#f87171"} 
                    stopOpacity={0.1}
                  />
                </linearGradient>              </defs>              
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="rgba(140, 140, 140, 0.2)" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={{ stroke: 'rgba(140, 140, 140, 0.2)' }}
                axisLine={{ stroke: 'rgba(140, 140, 140, 0.2)' }}
              />              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={{ stroke: 'rgba(140, 140, 140, 0.2)' }}
                axisLine={{ stroke: 'rgba(140, 140, 140, 0.2)' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    return (
                      <div className="bg-gray-900 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-200">{label}</p>
                        <p className={`text-sm font-bold ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          P&L: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={isPositive ? "#ffffff" : "#f87171"}
                fillOpacity={1}
                fill="url(#colorPnl)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CumulativePnlChart;
