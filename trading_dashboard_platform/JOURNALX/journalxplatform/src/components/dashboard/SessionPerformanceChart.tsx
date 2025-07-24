
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp } from 'lucide-react';

interface SessionData {
  name: string;
  pnl: number;
}

interface SessionPerformanceChartProps {
  data: SessionData[];
}

const SessionPerformanceChart = ({ data }: SessionPerformanceChartProps) => {
  return (
    <Card className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-black dark:text-white">
              Session Performance
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">P&L breakdown by trading sessions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] p-2 pb-6">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.2)" opacity={0.6} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tick={{ dy: 5, fill: 'currentColor' }}
              />
              <YAxis 
                stroke="currentColor" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tick={{ dx: -5, fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                  color: "var(--foreground)"
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                formatter={(value: number) => [
                  `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                  'Session P&L'
                ]}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    fill={entry.pnl >= 0 ? '#16a34a' : '#dc2626'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="text-center space-y-3">
              <div className="mx-auto p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-fit">
                <TrendingUp className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No session data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Session breakdown will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionPerformanceChart;

