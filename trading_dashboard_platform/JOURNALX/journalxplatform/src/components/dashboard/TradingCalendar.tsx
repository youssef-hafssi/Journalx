
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  getDate, 
  format,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

const TradingCalendar = ({ trades }: { trades: Trade[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const { theme } = useTheme();

  const tradesByDay = useMemo(() => {
    const data: { [key: string]: { pnl: number, trades: number } } = {};
    trades.forEach(trade => {
        // Use exitDate if available, otherwise use entryDate
        const dateToUse = trade.exitDate || trade.entryDate;
        if (dateToUse) {
          const dateKey = format(dateToUse, 'yyyy-MM-dd');
          if (!data[dateKey]) {
              data[dateKey] = { pnl: 0, trades: 0 };
          }
          data[dateKey].pnl += trade.pnl;
          data[dateKey].trades += 1;
        }
    });
    return data;
  }, [trades]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);
  const leadingEmptyDays = Array.from({ length: startingDayIndex }, () => ({ day: null, date: null, pnl: 0, trades: 0 }));

  const calendarDays = [
    ...leadingEmptyDays,
    ...daysInMonth.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayData = tradesByDay[dateKey] || { pnl: 0, trades: 0 };
        return {
            day: getDate(day),
            date: day,
            ...dayData
        };
    })
  ];
  
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToThisMonth = () => setCurrentDate(new Date());

  return (
    <Card className={`${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-card'} overflow-hidden`}>
      <CardHeader className="flex flex-row items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} 
                 className={theme === 'dark' ? 'bg-[#212121] border-gray-700 hover:bg-[#2a2a2a] text-gray-300' : ''}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : ''}`}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth} 
                 className={theme === 'dark' ? 'bg-[#212121] border-gray-700 hover:bg-[#2a2a2a] text-gray-300' : ''}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Button variant="outline" onClick={goToThisMonth} 
                 className={theme === 'dark' ? 'bg-[#212121] border-gray-700 hover:bg-[#2a2a2a] text-gray-300' : ''}
          >
            This month
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-card">
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map(day => (
            <div key={day} className={`text-center font-medium text-sm pb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
              {day}
            </div>
          ))}
          {calendarDays.map((dayInfo, index) => (
            <div key={index} className={`h-24 rounded-md p-1.5 flex flex-col ${
              theme === 'dark'
                ? dayInfo.day 
                  ? dayInfo.pnl !== 0
                    ? dayInfo.pnl > 0 
                      ? 'bg-green-500/10 border border-green-900/50' 
                      : 'bg-red-500/10 border border-red-900/50'
                    : 'bg-[#212121] border border-gray-800'
                  : 'bg-[#1a1a1a] border border-gray-800'
                : dayInfo.day 
                  ? dayInfo.pnl !== 0
                    ? dayInfo.pnl > 0 
                      ? 'bg-green-500/10 border border-green-200' 
                      : 'bg-red-500/10 border border-red-200'
                    : 'bg-card border border-border/50'
                  : 'bg-muted/30 border border-border/50'
            }`}>
              {dayInfo.day && dayInfo.date && (
                <>
                  <div className={`text-right text-xs font-medium ${
                    isToday(dayInfo.date) 
                      ? 'text-white font-bold' 
                      : theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'
                  }`}>{dayInfo.day}</div>
                  {dayInfo.trades > 0 && (
                    <div className="mt-auto text-center">
                      <p className={`font-bold text-sm ${dayInfo.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {dayInfo.pnl >= 0 ? '+' : '-'}${Math.abs(dayInfo.pnl).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{dayInfo.trades} {dayInfo.trades === 1 ? 'trade' : 'trades'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingCalendar;
