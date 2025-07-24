import { useState } from "react";
import { type Trade } from "@/components/dashboard/RecentTrades";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInMinutes } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Download, Folder } from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatisticalEdgeProps {
  trades: Trade[];
}

const StatisticalEdge = ({ trades = [] }: StatisticalEdgeProps) => {
  const [modelFilter, setModelFilter] = useState('all');
  const { theme } = useTheme();

  const models = [...new Set(trades.map(trade => trade.entryModel).filter(Boolean) as string[])];

  const filteredTrades = trades.filter(trade => modelFilter === 'all' || trade.entryModel === modelFilter);

  const formatTime = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const calculateDuration = (entry?: Date, exit?: Date) => {
    if (!entry || !exit || isNaN(entry.getTime()) || isNaN(exit.getTime())) return "N/A";
    const duration = differenceInMinutes(exit, entry);
    return `${duration} min`;
  }

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

  const handleExportCSV = () => {
    if (filteredTrades.length === 0) {
      return;
    }

    const formatNewsForCSV = (news: Trade['news']) => {
      if (!news || news.length === 0) {
        return "N/A";
      }
      const formattedNews = news.map(event => {
        if (!event?.name) return null;
        const type = event.type || 'grey';
        const name = event.name;
        const time = event.time ? `(${event.time})` : '';
        return `${type} folder news : ${name} ${time}`;
      }).filter(Boolean).join(', ');
      return formattedNews || "N/A";
    };

    const headers = ['Trade ID', 'Market / Asset', 'Model', 'Session', 'R/R', 'Entry Time', 'Duration', 'News', 'Profit'];
    
    const csvRows = filteredTrades.map((trade) => {
      const originalIndex = trades.findIndex(t => t === trade);
      const tradeId = trades.length - originalIndex;
      const profit = `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}`;
      
      return [
        tradeId,
        trade.symbol,
        trade.entryModel || 'N/A',
        trade.session || 'N/A',
        trade.rewardToRiskRatio || 'N/A',
        formatTime(trade.entryDate),
        calculateDuration(trade.entryDate, trade.exitDate),
        `"${formatNewsForCSV(trade.news)}"`,
        `"${profit}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_trades.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistical Edge</h1>
          <p className="text-muted-foreground">Detailed breakdown of each trade to identify your statistical edge.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {models.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
        </div>
      </div>
      
      {filteredTrades.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade ID</TableHead>
                <TableHead>Market / Asset</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>R/R</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>News</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => {
                const originalIndex = trades.findIndex(t => t === trade);
                const tradeId = trades.length - originalIndex;
                return (
                  <TableRow key={originalIndex}>
                    <TableCell className="font-medium">{tradeId}</TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>{trade.entryModel || 'N/A'}</TableCell>
                    <TableCell>{trade.session || 'N/A'}</TableCell>
                    <TableCell>{trade.rewardToRiskRatio || 'N/A'}</TableCell>
                    <TableCell>{formatTime(trade.entryDate)}</TableCell>
                    <TableCell>{calculateDuration(trade.entryDate, trade.exitDate)}</TableCell>
                    <TableCell>{formatNews(trade.news)}</TableCell>
                    <TableCell className={`text-right font-semibold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="col-span-full">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {modelFilter !== 'all' ? 'No trades found for the selected model.' : 'No trades available to display.'}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatisticalEdge;
