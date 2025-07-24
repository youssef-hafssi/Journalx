import { useState, useMemo } from "react";
import { type Trade } from "@/components/dashboard/RecentTrades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from '@/contexts/ThemeContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInMinutes } from 'date-fns';
import { BarChart, Clock, Award, AlarmClock } from 'lucide-react';


interface EdgeBuilderProps {
  trades: Trade[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => {
  const { theme } = useTheme();
  return (
    <Card className={theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : ''}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
};

const EdgeBuilder = ({ trades = [] }: EdgeBuilderProps) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const { theme } = useTheme();

  const models = [...new Set(trades.map(trade => trade.entryModel).filter(Boolean) as string[])];
  if (models.length > 0 && !selectedModel) {
    setSelectedModel(models[0]);
  }

  const filteredTrades = useMemo(() => {
    if (!selectedModel) {
      return [];
    }
    return trades.filter(trade => trade.entryModel === selectedModel);
  }, [trades, selectedModel]);

  const stats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        avgRr: 'N/A',
        maxRr: 'N/A',
        avgDuration: 'N/A',
        avgEntryTime: 'N/A',
      };
    }

    const rrTrades = filteredTrades.filter(t => typeof t.rewardToRiskRatio === 'number' && t.rewardToRiskRatio > 0);
    const avgRr = rrTrades.length > 0
      ? (rrTrades.reduce((acc, t) => acc + t.rewardToRiskRatio!, 0) / rrTrades.length).toFixed(2) + 'R'
      : 'N/A';
    const maxRr = rrTrades.length > 0
      ? Math.max(...rrTrades.map(t => t.rewardToRiskRatio!)).toFixed(2) + 'R'
      : 'N/A';

    const durationTrades = filteredTrades.filter(t => t.entryDate && t.exitDate);
    const avgDurationMinutes = durationTrades.length > 0
      ? durationTrades.reduce((acc, t) => acc + differenceInMinutes(t.exitDate!, t.entryDate!), 0) / durationTrades.length
      : null;
    const avgDuration = avgDurationMinutes !== null ? `${Math.round(avgDurationMinutes)} min` : 'N/A';

    const entryTimeTrades = filteredTrades.filter(t => t.entryDate);

    let avgEntryTime = 'N/A';
    if (entryTimeTrades.length > 0) {
      // Count frequency of each entry time (rounded to nearest hour for grouping)
      const timeFrequency: { [key: string]: number } = {};

      entryTimeTrades.forEach(trade => {
        const time = `${String(trade.entryDate!.getHours()).padStart(2, '0')}:${String(trade.entryDate!.getMinutes()).padStart(2, '0')}`;
        timeFrequency[time] = (timeFrequency[time] || 0) + 1;
      });

      // Find the most frequent entry time (mode)
      let mostFrequentTime = '';
      let maxCount = 0;

      Object.entries(timeFrequency).forEach(([time, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentTime = time;
        }
      });

      avgEntryTime = mostFrequentTime || 'N/A';
    }

    return { avgRr, maxRr, avgDuration, avgEntryTime };
  }, [filteredTrades]);

  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edge Builder</h1>
          <p className="text-muted-foreground">Analyze your trading models to find your edge.</p>
        </div>
        <div className="w-full sm:w-auto">
          {models.length > 0 ? (
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
             <p className="text-muted-foreground">No trading models found.</p>
          )}
        </div>
      </div>

      {filteredTrades.length > 0 ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Average R/R" value={stats.avgRr} icon={BarChart} />
            <StatCard title="Max R/R" value={stats.maxRr} icon={Award} />
            <StatCard title="Average Duration" value={stats.avgDuration} icon={Clock} />
            <StatCard title="Average Entry Time" value={stats.avgEntryTime} icon={AlarmClock} />
          </div>

          <Card className={`animate-fade-in ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : ''}`}>
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-gray-200' : ''}>Trades for {selectedModel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">P/L</TableHead>
                      <TableHead className="text-right">R/R</TableHead>
                      <TableHead className="text-right">Duration (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell className="capitalize">{trade.tradeType}</TableCell>
                        <TableCell className={`text-right font-medium ${trade.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${trade.pnl.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{trade.rewardToRiskRatio ? `${trade.rewardToRiskRatio.toFixed(2)}R` : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {trade.entryDate && trade.exitDate ? differenceInMinutes(trade.exitDate, trade.entryDate) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className={theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : ''}>
          <CardContent className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
            {selectedModel ? 'No trades found for the selected model.' : 'Please add trades with models to begin.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EdgeBuilder;
