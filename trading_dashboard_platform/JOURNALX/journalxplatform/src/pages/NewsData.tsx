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
import { differenceInMinutes } from 'date-fns';
import { BarChart, Clock, Award, AlarmClock, Folder } from 'lucide-react';
import { MultiSelect } from "@/components/ui/multi-select";

interface NewsDataProps {
  trades: Trade[];
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const formatNews = (news: Trade['news']) => {
  if (!news || news.length === 0) {
    return "N/A";
  }

  const newsElements = news.map((event, index) => {
    if (!event?.name) return null;

    const type = event.type || 'grey';
    const name = event.name;
    const time = event.time ? `(${event.time})` : '';

    let iconColor = 'hsl(var(--muted-foreground))';
    if (type === 'red') {
      iconColor = 'hsl(var(--destructive))';
    } else if (type === 'orange') {
      iconColor = '#F97316'; // orange-500
    }

    return (
      <div key={index} className="flex items-center gap-1.5">
        <Folder color={iconColor} className="h-4 w-4 shrink-0" />
        <span>{`${name} ${time}`}</span>
      </div>
    );
  }).filter(Boolean);

  if (newsElements.length === 0) {
    return "N/A";
  }

  return <div className="flex flex-col gap-1">{newsElements}</div>;
};

const getNewsEventString = (event: NonNullable<Trade['news']>[0]) => {
    if (!event.name || !event.time) return '';
    const type = event.type || 'grey';
    let typeName = type.charAt(0).toUpperCase() + type.slice(1);
    return `${typeName} Folder: ${event.name} (${event.time})`;
}

const NewsData = ({ trades = [] }: NewsDataProps) => {
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const { theme } = useTheme();

  const allNewsEvents = useMemo(() => {
    const newsSet = new Set<string>();
    trades.forEach(trade => {
      trade.news?.forEach(event => {
        const eventString = getNewsEventString(event);
        if (eventString) {
          newsSet.add(eventString);
        }
      });
    });
    const newsEvents = Array.from(newsSet).map(eventStr => ({ value: eventStr, label: eventStr }));
    return [{ value: "No News", label: "No News" }, ...newsEvents];
  }, [trades]);

  const handleNewsSelection = (newSelection: string[]) => {
    const justAddedNoNews = newSelection.includes('No News') && !selectedNews.includes('No News');

    if (justAddedNoNews) {
      setSelectedNews(['No News']);
    } else if (newSelection.includes('No News') && newSelection.length > 1) {
      setSelectedNews(newSelection.filter(s => s !== 'No News'));
    } else {
      setSelectedNews(newSelection);
    }
  };

  const filteredTrades = useMemo(() => {
    if (selectedNews.length === 0) {
      return [];
    }

    if (selectedNews[0] === 'No News') {
      return trades.filter(trade => !trade.news || trade.news.length === 0);
    }

    return trades.filter(trade => {
      if (!trade.news || trade.news.length === 0) return false;
      const tradeNewsStrings = trade.news.map(getNewsEventString);
      return selectedNews.every(selected => tradeNewsStrings.includes(selected));
    });
  }, [trades, selectedNews]);

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
    const avgEntryTimeMinutes = entryTimeTrades.length > 0
      ? entryTimeTrades.reduce((acc, t) => acc + (t.entryDate!.getHours() * 60 + t.entryDate!.getMinutes()), 0) / entryTimeTrades.length
      : null;
      
    let avgEntryTime = 'N/A';
    if (avgEntryTimeMinutes !== null) {
      const hours = Math.floor(avgEntryTimeMinutes / 60);
      const minutes = Math.round(avgEntryTimeMinutes % 60);
      avgEntryTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    return { avgRr, maxRr, avgDuration, avgEntryTime };
  }, [filteredTrades]);

  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">News Data</h1>
          <p className="text-muted-foreground">Analyze your trading performance based on news events.</p>
        </div>
        <div className="w-full sm:w-[400px]">
          <MultiSelect
            options={allNewsEvents}
            selected={selectedNews}
            onChange={handleNewsSelection}
            placeholder="Select news events..."
            className="w-full"
          />
        </div>
      </div>

      {selectedNews.length === 0 ? (
         <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Please select one or more news events to see statistics.
          </CardContent>
        </Card>
      ) : filteredTrades.length > 0 ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Average R/R" value={stats.avgRr} icon={BarChart} />
            <StatCard title="Max R/R" value={stats.maxRr} icon={Award} />
            <StatCard title="Average Duration" value={stats.avgDuration} icon={Clock} />
            <StatCard title="Average Entry Time" value={stats.avgEntryTime} icon={AlarmClock} />
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Trades for selected news events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>News</TableHead>
                      <TableHead className="text-right">P/L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => {
                       const originalIndex = trades.findIndex(t => t.id === trade.id);
                       const tradeId = trades.length - originalIndex;
                      return (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{tradeId}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell>{formatNews(trade.news)}</TableCell>
                        <TableCell className={`text-right font-medium ${trade.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${trade.pnl.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No trades found for the selected combination of news events.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsData;
