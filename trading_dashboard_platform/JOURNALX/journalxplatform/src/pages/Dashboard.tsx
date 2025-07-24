import { useMemo, useState } from 'react';
import { PerformanceChart } from '@/components/journal/PerformanceChart';
import { format, isAfter, isBefore, isEqual } from "date-fns";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTrades } from '@/hooks/use-trades';

const Dashboard = () => {
  const { theme } = useTheme();
  const { trades } = useTrades();

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // Filter trades based on date range
  const filteredTrades = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return trades;
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      
      if (dateRange.from && dateRange.to) {
        return (isAfter(tradeDate, dateRange.from) || isEqual(tradeDate, dateRange.from)) &&
               (isBefore(tradeDate, dateRange.to) || isEqual(tradeDate, dateRange.to));
      } else if (dateRange.from) {
        return isAfter(tradeDate, dateRange.from) || isEqual(tradeDate, dateRange.from);
      } else if (dateRange.to) {
        return isBefore(tradeDate, dateRange.to) || isEqual(tradeDate, dateRange.to);
      }
      
      return true;
    });
  }, [trades, dateRange]);

  const dashboardMetrics = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        netPnl: 0,
        winRate: 0,
        winningTradesCount: 0,
        losingTradesCount: 0,
        avgWin: 0,
        avgLoss: 0,
        avgRiskRewardRatio: 0,
        profitFactor: 0,
        avgWinLossRatio: 0,
        dailyPnl: [],
        performanceData: [],
        cumulativePnl: [],
        dayWinPercent: 0,
        winningDays: 0,
        losingDays: 0,
        sessionPnl: [],
      };
    }

    const winningTrades = filteredTrades.filter((t) => t.pnl > 0);
    const losingTrades = filteredTrades.filter((t) => t.pnl <= 0);

    const netPnl = filteredTrades.reduce((acc, trade) => acc + trade.pnl, 0);
    const winRate = filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0;

    const grossProfit = winningTrades.reduce((acc, trade) => acc + trade.pnl, 0);
    const losingTradesWithLoss = losingTrades.filter(t => t.pnl < 0);
    const grossLoss = Math.abs(losingTradesWithLoss.reduce((acc, trade) => acc + trade.pnl, 0));

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTradesWithLoss.length > 0 ? -grossLoss / losingTradesWithLoss.length : 0;

    // Calculate average risk-to-reward ratio
    const tradesWithRRR = filteredTrades.filter(t => t.rewardToRiskRatio && t.rewardToRiskRatio > 0);
    const avgRiskRewardRatio = tradesWithRRR.length > 0 
      ? tradesWithRRR.reduce((sum, trade) => sum + (trade.rewardToRiskRatio || 0), 0) / tradesWithRRR.length 
      : 0;

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    const avgWinLossRatio = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : (avgWin > 0 ? Infinity : 0);

    const tradesByDate = filteredTrades.reduce((acc, trade) => {
      const groupDate = trade.date;
      if (!acc[groupDate]) acc[groupDate] = 0;
      acc[groupDate] += trade.pnl;
      return acc;
    }, {} as Record<string, number>);

    const sessionPnl = Object.entries(
      filteredTrades.reduce((acc, trade) => {
        const session = trade.session || 'N/A';
        if (!acc[session]) {
          acc[session] = 0;
        }
        acc[session] += trade.pnl;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, pnl]) => ({ name, pnl }));

    const dailyPnlList = Object.entries(tradesByDate)
      .map(([date, pnl]) => ({
        name: format(new Date(date), "MM/dd/yy"),
        pnl,
        dateObj: new Date(date),
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const winningDays = Object.values(tradesByDate).filter((pnl) => pnl > 0).length;
    const totalTradingDays = Object.keys(tradesByDate).length;
    const losingDays = totalTradingDays - winningDays;
    const dayWinPercent = totalTradingDays > 0 ? (winningDays / totalTradingDays) * 100 : 0;

    let cumulative = 0;
    const cumulativePnlData = dailyPnlList.map((day) => {
      cumulative += day.pnl;
      return { name: day.name, pnl: cumulative };
    });

    const cumulativePnl =
      cumulativePnlData.length > 0
        ? [{ name: "Start", pnl: 0 }, ...cumulativePnlData]
        : [];

    // Format data for PerformanceChart
    let cumulativeForPerformance = 0;
    const performanceData = dailyPnlList.map((day) => {
      cumulativeForPerformance += day.pnl;
      return {
        date: day.dateObj.toISOString(),
        value: day.pnl,
        cumulativeValue: cumulativeForPerformance,
      };
    });

    // Add initial 0 point if we have data
    if (performanceData.length > 0) {
      performanceData.unshift({
        date: 'start',
        value: 0,
        cumulativeValue: 0,
      });
    }

    return {
      netPnl,
      winRate,
      winningTradesCount: winningTrades.length,
      losingTradesCount: losingTrades.length,
      avgWin,
      avgLoss,
      avgRiskRewardRatio,
      profitFactor,
      avgWinLossRatio,
      dailyPnl: dailyPnlList.map(({ name, pnl }) => ({ name, pnl })),
      performanceData,
      cumulativePnl,
      dayWinPercent,
      winningDays,
      losingDays,
      sessionPnl,
    };
  }, [filteredTrades]);

  const calculateSharpeRatio = () => {
    if (dashboardMetrics.dailyPnl.length === 0) return 0;
    
    const returns = dashboardMetrics.dailyPnl.map(day => day.pnl);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized Sharpe ratio
  };

  const largestWin = Math.max(...filteredTrades.map(t => t.pnl), 0);
  const largestLoss = Math.min(...filteredTrades.map(t => t.pnl), 0);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal<span className="text-red-600">X</span> <span className="text-gray-900 dark:text-white">Analytics</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Date Range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setIsDatePickerOpen(false);
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total P&L</div>
            <div className={`text-2xl font-bold mb-1 ${
              dashboardMetrics.netPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${dashboardMetrics.netPnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Year to date</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Win Rate</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {dashboardMetrics.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Last 100 trades</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Profit Factor</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {isFinite(dashboardMetrics.profitFactor) ? dashboardMetrics.profitFactor.toFixed(1) : "∞"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Gross profit / gross loss</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Risk to Reward</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {dashboardMetrics.avgRiskRewardRatio > 0 ? `1:${dashboardMetrics.avgRiskRewardRatio.toFixed(2)}` : 'N/A'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Risk to reward ratio</div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance Over Time</h3>
            <div className="h-80">
              <PerformanceChart
                data={dashboardMetrics.performanceData}
                title="P&L Over Time"
                valuePrefix="$"
                isDarkMode={theme === 'dark'}
                overallPerformance={dashboardMetrics.netPnl > 0 ? 'profit' : dashboardMetrics.netPnl < 0 ? 'loss' : 'neutral'}
                showCumulative={true}
              />
            </div>
          </div>
        </div>

        {/* Bottom KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Win</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${dashboardMetrics.avgWin.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Per winning trade</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Loss</div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              ${Math.abs(dashboardMetrics.avgLoss).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Per losing trade</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Largest Win</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              ${largestWin.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Single trade</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Largest Loss</div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              ${Math.abs(largestLoss).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Single trade</div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {calculateSharpeRatio().toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Risk-adjusted return</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
