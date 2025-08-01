import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

type MarketCondition = 'bullish' | 'bearish' | 'consolidation';

interface CurrencyConditions {
  EUR: MarketCondition | null;
  GBP: MarketCondition | null;
  JPY: MarketCondition | null;
  CAD: MarketCondition | null;
  CHF: MarketCondition | null;
  NZD: MarketCondition | null;
  AUD: MarketCondition | null;
  DXY: MarketCondition | null;
}

interface PairAnalysis {
  pair: string;
  base: string;
  quote: string;
  tradable: boolean;
  direction?: 'bullish' | 'bearish';
  baseCondition: MarketCondition;
  quoteCondition: MarketCondition;
}

const ForexTradableAssetsPage = () => {
  const [currencyConditions, setCurrencyConditions] = useState<CurrencyConditions>({
    EUR: null,
    GBP: null,
    JPY: null,
    CAD: null,
    CHF: null,
    NZD: null,
    AUD: null,
    DXY: null,
  });

  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'NZD', 'AUD', 'DXY'];

  const forexPairs = [
    // Major pairs
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD', 'NZDUSD',
    // Cross pairs
    'EURGBP', 'EURJPY', 'EURCAD', 'EURCHF', 'EURAUD', 'EURNZD',
    'GBPJPY', 'GBPCAD', 'GBPCHF', 'GBPAUD', 'GBPNZD',
    'JPYCHF', 'JPYCAD', 'JPYAUD', 'JPYNZD',
    'CADCHF', 'CADAUD', 'CADNZD',
    'CHFAUD', 'CHFNZD',
    'AUDNZD'
  ];

  const updateCurrencyCondition = (currency: keyof CurrencyConditions, condition: MarketCondition | null) => {
    setCurrencyConditions(prev => ({
      ...prev,
      [currency]: condition
    }));
  };

  const analyzePairs = useMemo((): PairAnalysis[] => {
    return forexPairs.map(pair => {
      let base: string, quote: string;

      if (pair.includes('USD')) {
        if (pair.startsWith('USD')) {
          base = 'DXY';
          quote = pair.slice(3);
        } else {
          base = pair.slice(0, 3);
          quote = 'DXY';
        }
      } else {
        base = pair.slice(0, 3);
        quote = pair.slice(3);
      }

      const baseCondition = currencyConditions[base as keyof CurrencyConditions];
      const quoteCondition = currencyConditions[quote as keyof CurrencyConditions];

      // Skip pairs where either currency condition is not selected
      if (!baseCondition || !quoteCondition) {
        return {
          pair,
          base,
          quote,
          tradable: false,
          direction: undefined,
          baseCondition,
          quoteCondition
        };
      }

      // Determine if tradable
      const isTradable = (
        (baseCondition === 'bullish' && quoteCondition === 'bearish') ||
        (baseCondition === 'bearish' && quoteCondition === 'bullish') ||
        (baseCondition === 'bullish' && quoteCondition === 'consolidation') ||
        (baseCondition === 'bearish' && quoteCondition === 'consolidation') ||
        (baseCondition === 'consolidation' && quoteCondition === 'bullish') ||
        (baseCondition === 'consolidation' && quoteCondition === 'bearish')
      );

      // Determine direction if tradable
      let direction: 'bullish' | 'bearish' | undefined;
      if (isTradable) {
        if (baseCondition === 'bullish' && (quoteCondition === 'bearish' || quoteCondition === 'consolidation')) {
          direction = 'bullish';
        } else if (baseCondition === 'bearish' && (quoteCondition === 'bullish' || quoteCondition === 'consolidation')) {
          direction = 'bearish';
        } else if (baseCondition === 'consolidation' && quoteCondition === 'bullish') {
          direction = 'bearish';
        } else if (baseCondition === 'consolidation' && quoteCondition === 'bearish') {
          direction = 'bullish';
        }
      }

      return {
        pair,
        base,
        quote,
        tradable: isTradable,
        direction,
        baseCondition,
        quoteCondition
      };
    });
  }, [currencyConditions]);

  const tradablePairs = analyzePairs.filter(p => p.tradable);
  const nonTradablePairs = analyzePairs.filter(p => !p.tradable);

  const handleAnalyze = () => {
    setHasAnalyzed(true);
  };

  const resetConditions = () => {
    setCurrencyConditions({
      EUR: 'consolidation',
      GBP: 'consolidation',
      JPY: 'consolidation',
      CAD: 'consolidation',
      CHF: 'consolidation',
      NZD: 'consolidation',
      AUD: 'consolidation',
      DXY: 'consolidation',
    });
    setHasAnalyzed(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">JournalX Assets Analyzer</h1>
        </div>
        <p className="text-muted-foreground">
          Set market conditions for each currency to identify tradable and non-tradable pairs
        </p>
      </div>

      {/* Currency Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Currency Market Conditions
            </CardTitle>
            <Button variant="outline" onClick={resetConditions}>
              Reset All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {currencies.map(currency => (
              <div key={currency} className="space-y-2">
                <label className="text-sm font-medium">{currency}</label>
                <Select
                  value={currencyConditions[currency as keyof CurrencyConditions] || undefined}
                  onValueChange={(value: MarketCondition) =>
                    updateCurrencyCondition(currency as keyof CurrencyConditions, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the orderflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullish">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Bullish
                      </div>
                    </SelectItem>
                    <SelectItem value="bearish">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Bearish
                      </div>
                    </SelectItem>
                    <SelectItem value="consolidation">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-yellow-500" />
                        Consolidation
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={handleAnalyze} size="lg" className="px-8">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analyze Pairs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasAnalyzed && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tradable Pairs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Tradable Pairs ({tradablePairs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tradablePairs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No tradable pairs with current conditions
                  </p>
                ) : (
                  tradablePairs.map(pair => (
                    <div key={pair.pair} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{pair.pair}</span>
                      </div>
                      <Badge className={pair.direction === 'bullish' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {pair.direction === 'bullish' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {pair.direction}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Non-Tradable Pairs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Minus className="h-5 w-5" />
                Non-Tradable Pairs ({nonTradablePairs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nonTradablePairs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    All pairs are tradable with current conditions
                  </p>
                ) : (
                  nonTradablePairs.map(pair => (
                    <div key={pair.pair} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{pair.pair}</span>
                      </div>
                      <Badge variant="secondary">
                        <Minus className="h-3 w-3 mr-1" />
                        No Trade
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Trading Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            IMPORTANT: Professional Trading Guidelines
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>DISCLAIMER:</strong> This tool provides market analysis only. Trading involves substantial risk of loss. Use at your own discretion.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Critical Warning */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-bold text-red-700 dark:text-red-300">NEVER Use This as a Standalone Strategy</h4>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  This analysis is a <strong>supporting tool only</strong>. Always combine with comprehensive market analysis, proper risk management, and your trading plan.
                </p>
              </div>
            </div>
          </div>

          {/* Professional Guidelines */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Essential Trading Principles
            </h3>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">1. Market Confirmation Required</h4>
                <p className="text-sm text-muted-foreground">
                  Only execute trades when multiple timeframes and technical indicators confirm the directional bias. Look for confluence with support/resistance levels, trend analysis, and volume confirmation.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">2. Risk Management is Non-Negotiable</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Never risk more than 1-2% of your account per trade.</strong> Set stop-losses before entering positions and maintain strict position sizing rules regardless of signal strength.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">3. Session Timing Matters</h4>
                <p className="text-sm text-muted-foreground">
                  Avoid trading during low-volatility periods (Asian session overlaps, major holidays). Focus on London and New York session openings for optimal liquidity and price movement.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">4. Fundamental Analysis Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor economic calendars, central bank communications, and geopolitical events. Currency strength analysis should align with fundamental drivers and market sentiment.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">5. Continuous Strategy Refinement</h4>
                <p className="text-sm text-muted-foreground">
                  Backtest this analysis method with your trading style. Keep detailed trade journals and regularly review performance to identify optimal market conditions for this approach.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Warning */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-center">
              <strong>Remember:</strong> Professional traders use multiple confirmation signals. This tool should represent only one component of your comprehensive trading strategy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForexTradableAssetsPage;
