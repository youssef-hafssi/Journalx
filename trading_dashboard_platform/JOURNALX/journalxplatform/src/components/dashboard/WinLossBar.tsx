
import React from 'react';

interface WinLossBarProps {
  win: number;
  loss: number;
}
const WinLossBar = ({ win, loss }: WinLossBarProps) => {
  const total = win + Math.abs(loss);
  const winPercentage = total > 0 ? (win / total) * 100 : 0;

  return (
    <div className="h-2 w-full bg-red-500/50 rounded-full mt-4">
      <div
        className="h-2 bg-green-500 rounded-full"
        style={{ width: `${winPercentage}%` }}
      />
    </div>
  );
};

export default WinLossBar;
