
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import { type Trade } from '@/components/dashboard/RecentTrades';
import { useTheme } from '@/contexts/ThemeContext';

const CalendarPage = ({ trades }: { trades: Trade[] }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Trading Calendar</h1>
        </div>
        <div className={`rounded-lg ${theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border'}`}>
            <TradingCalendar trades={trades} />
        </div>
    </div>
  );
};

export default CalendarPage;
