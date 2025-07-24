"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Calendar } from "lucide-react";

interface PerformanceData {
  date: string;
  value: number;
  cumulativeValue: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title: string;
  valuePrefix?: string;
  valueSuffix?: string;
  isDarkMode?: boolean;
  overallPerformance?: 'profit' | 'loss' | 'neutral';
}

export function PerformanceChart({ 
  data, 
  title, 
  valuePrefix = "", 
  valueSuffix = "", 
  isDarkMode = false,
  overallPerformance = 'neutral' 
}: PerformanceChartProps) {  
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className={`mx-auto p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full w-fit`}>
            <TrendingUp className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>No trading data available</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Performance data will appear here</p>
        </div>
      </div>
    );
  }

  // Determine color based on performance
  const lineColor = overallPerformance === 'profit' 
    ? (isDarkMode ? '#00ff80' : '#00cc66') 
    : overallPerformance === 'loss' 
      ? (isDarkMode ? '#ff0080' : '#cc0066') 
      : (isDarkMode ? '#00ffff' : '#00cccc');
      
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >        
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333333" : "#e5e7eb"} opacity={0.6} />
        <XAxis 
          dataKey="date" 
          stroke={isDarkMode ? "#9ca3af" : "#9ca3af"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: isDarkMode ? "#9ca3af" : "#9ca3af", dy: 5 }}
          tickFormatter={(value) => {
            return format(new Date(value), "MMM d");
          }}
        />
        <YAxis 
          stroke={isDarkMode ? "#9ca3af" : "#9ca3af"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: isDarkMode ? "#9ca3af" : "#9ca3af", dx: -5 }}
          tickFormatter={(value) => {
            if (Math.abs(value) >= 1000) {
              return `${valuePrefix}${(value / 1000).toFixed(1)}k${valueSuffix}`;
            }
            return `${valuePrefix}${value}${valueSuffix}`;
          }}
        />        
        <Tooltip 
          contentStyle={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "white",
            border: `1px solid ${isDarkMode ? "#333333" : "#d1d5db"}`,
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
            color: isDarkMode ? "#e5e7eb" : "#111827"
          }}
          labelStyle={{ color: isDarkMode ? "#e5e7eb" : "#111827", fontWeight: 500 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border rounded p-3 shadow-lg`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-1`}>
                    {format(new Date(label), "MMM d, yyyy")}
                  </p>                  
                  <p className={`text-sm ${Number(payload[0].value) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Daily: {`${valuePrefix}${Number(payload[0].value).toLocaleString('en-US', {minimumFractionDigits: 2})}${valueSuffix}`}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Cumulative: {`${valuePrefix}${Number(payload[0].payload.cumulativeValue).toLocaleString('en-US', {minimumFractionDigits: 2})}${valueSuffix}`}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 2, fill: lineColor }}
          activeDot={{ r: 5, strokeWidth: 2, fill: lineColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
