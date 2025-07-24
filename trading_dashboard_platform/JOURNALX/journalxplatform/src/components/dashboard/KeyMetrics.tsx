import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

interface Trade {
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

interface KeyMetricsProps {
  trades: Trade[];
}

export function KeyMetrics({ trades }: KeyMetricsProps) {
  // Calculate Risk Metrics
  const calculateMaxDrawdown = () => {
    if (trades.length === 0) return 0;
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(trade => {
      runningPnL += trade.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = (peak - runningPnL) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    return maxDrawdown;
  };

  const calculateRiskRewardRatio = () => {
    const tradesWithRRR = trades.filter(t => t.rewardToRiskRatio && t.rewardToRiskRatio > 0);
    return tradesWithRRR.length > 0 
      ? tradesWithRRR.reduce((sum, trade) => sum + (trade.rewardToRiskRatio || 0), 0) / tradesWithRRR.length 
      : 0;
  };

  const calculateVolatility = () => {
    if (trades.length < 2) return 0;
    const returns = trades.map(t => t.pnl);
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) / mean * 100;
  };

  const calculateSharpeRatio = () => {
    if (trades.length === 0) return 0;
    const returns = trades.map(trade => trade.pnl);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  };

  // Calculate Trading Consistency
  const calculateConsecutiveWins = () => {
    let maxWins = 0;
    let currentWins = 0;
    trades.forEach(trade => {
      if (trade.pnl > 0) {
        currentWins++;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentWins = 0;
      }
    });
    return { current: currentWins, max: maxWins };
  };

  const calculateConsecutiveLosses = () => {
    let maxLosses = 0;
    let currentLosses = 0;
    trades.forEach(trade => {
      if (trade.pnl <= 0) {
        currentLosses++;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        currentLosses = 0;
      }
    });
    return { current: currentLosses, max: maxLosses };
  };

  const calculateWinDays = () => {
    const dayPnL = trades.reduce((acc, trade) => {
      const date = trade.date;
      acc[date] = (acc[date] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);
    
    const winDays = Object.values(dayPnL).filter(pnl => pnl > 0).length;
    const totalDays = Object.keys(dayPnL).length;
    return { winDays, totalDays, percentage: totalDays > 0 ? (winDays / totalDays) * 100 : 0 };
  };

  const calculateAverageDailyPnL = () => {
    const dayPnL = trades.reduce((acc, trade) => {
      const date = trade.date;
      acc[date] = (acc[date] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);
    
    const dailyReturns = Object.values(dayPnL);
    return dailyReturns.length > 0 
      ? dailyReturns.reduce((sum, pnl) => sum + pnl, 0) / dailyReturns.length 
      : 0;
  };

  const calculateProfitConsistency = () => {
    const dayPnL = trades.reduce((acc, trade) => {
      const date = trade.date;
      acc[date] = (acc[date] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);
    
    const profitableDays = Object.values(dayPnL).filter(pnl => pnl > 0).length;
    const totalDays = Object.keys(dayPnL).length;
    return totalDays > 0 ? (profitableDays / totalDays) * 100 : 0;
  };

  // Calculate Trade Execution
  const calculateAverageHoldingTime = () => {
    const tradesWithDates = trades.filter(t => t.entryDate && t.exitDate);
    if (tradesWithDates.length === 0) return 0;
    
    const totalHours = tradesWithDates.reduce((sum, trade) => {
      const entry = new Date(trade.entryDate!);
      const exit = new Date(trade.exitDate!);
      return sum + (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    return totalHours / tradesWithDates.length;
  };

  const getBestTimeToEnter = () => {
    const sessionCounts = trades.reduce((acc, trade) => {
      const session = trade.session || 'Unknown';
      acc[session] = (acc[session] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sessionCounts).reduce((best, [session, count]) => 
      count > best.count ? { session, count } : best
    , { session: 'N/A', count: 0 }).session;
  };

  const getBestDayOfWeek = () => {
    const dayPnL = trades.reduce((acc, trade) => {
      const day = new Date(trade.date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + trade.pnl;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(dayPnL).reduce((best, [day, pnl]) => 
      pnl > best.pnl ? { day, pnl } : best
    , { day: 'N/A', pnl: -Infinity }).day;
  };

  // Advanced Metrics
  const winStreak = calculateConsecutiveWins();
  const winDaysData = calculateWinDays();
  
  const maxDrawdown = calculateMaxDrawdown();
  const riskRewardRatio = calculateRiskRewardRatio();
  const volatility = calculateVolatility();
  const sharpeRatio = calculateSharpeRatio();
  const consecutiveWins = calculateConsecutiveWins();
  const consecutiveLosses = calculateConsecutiveLosses();
  const avgDailyPnL = calculateAverageDailyPnL();
  const profitConsistency = calculateProfitConsistency();
  const avgHoldingTime = calculateAverageHoldingTime();
  const bestTimeToEnter = getBestTimeToEnter();
  const bestDayOfWeek = getBestDayOfWeek();

  return (
    <div className="space-y-6">
      {/* Risk Metrics and Trading Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Risk Metrics</CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Max Drawdown</span>
              <span className="font-medium text-red-600">-{maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Risk/Reward Ratio</span>
              <span className="font-medium text-gray-800 dark:text-white">{riskRewardRatio.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Volatility</span>
              <span className="font-medium text-gray-800 dark:text-white">{volatility.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Beta</span>
              <span className="font-medium text-gray-800 dark:text-white">0.85</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Sharpe Ratio</span>
              <span className="font-medium text-gray-800 dark:text-white">{sharpeRatio.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Trading Consistency</CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Consecutive Wins</span>
              <span className="font-medium text-gray-800 dark:text-white">{consecutiveWins.current} (Max: {consecutiveWins.max})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Consecutive Losses</span>
              <span className="font-medium text-gray-800 dark:text-white">{consecutiveLosses.current} (Max: {consecutiveLosses.max})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Win Days</span>
              <span className="font-medium text-gray-800 dark:text-white">{winDaysData.winDays}/{winDaysData.totalDays} ({winDaysData.percentage.toFixed(1)}%)</span>
            </div>            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Average Daily P&L</span>
              <span className={`font-medium ${avgDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${avgDailyPnL.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Profit Consistency</span>
              <span className="font-medium text-gray-800 dark:text-white">{profitConsistency.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Execution and Psychological Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Trade Execution</CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Average Holding Time</span>
              <span className="font-medium text-gray-800 dark:text-white">{Math.floor(avgHoldingTime)}h {Math.floor((avgHoldingTime % 1) * 60)}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Best Time to Enter</span>
              <span className="font-medium text-gray-800 dark:text-white">{bestTimeToEnter}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Best Day of Week</span>
              <span className="font-medium text-gray-800 dark:text-white">{bestDayOfWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Slippage</span>
              <span className="font-medium text-gray-800 dark:text-white">0.12%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Commission Impact</span>
              <span className="font-medium text-gray-800 dark:text-white">3.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Psychological Metrics</CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Revenge Trading</span>
              <span className="font-medium text-gray-800 dark:text-white">2 instances</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">FOMO Trades</span>
              <span className="font-medium text-gray-800 dark:text-white">5 instances</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Discipline Score</span>
              <span className="font-medium text-gray-800 dark:text-white">8.2/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Emotional Control</span>
              <span className="font-medium text-gray-800 dark:text-white">7.5/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Plan Adherence</span>
              <span className="font-medium text-gray-800 dark:text-white">85%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Advanced Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Winning Streak</CardTitle>
              <Calendar className="h-4 w-4 ml-auto text-gray-600 dark:text-gray-300" />
            </CardHeader><CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{winStreak.current}</div>
              <p className="text-xs text-gray-700 dark:text-gray-300">Longest consecutive winning trades</p>
              <div className="mt-2">
                <Progress value={(winStreak.current / winStreak.max) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mt-1">
                  <span>Current: {winStreak.current}</span>
                  <span>Record: {winStreak.max}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Trading Hours</CardTitle>
              <Clock className="h-4 w-4 ml-auto text-gray-600 dark:text-gray-300" />
            </CardHeader><CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">187</div>
              <p className="text-xs text-gray-700 dark:text-gray-300">Total hours in market this month</p>
              <div className="mt-2">
                <Progress value={65} className="h-2" />
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mt-1">
                  <span>Avg: 6.2h/day</span>
                  <span>Target: 8h/day</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Profit per Hour</CardTitle>
              <TrendingUp className="h-4 w-4 ml-auto text-gray-600 dark:text-gray-300" />
            </CardHeader><CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">$26.74</div>
              <p className="text-xs text-gray-700 dark:text-gray-300">Average hourly profit</p>
              <div className="mt-2">
                <Progress value={85} className="h-2" />
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mt-1">
                  <span>Last Month: $21.50</span>
                  <span>+24.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
