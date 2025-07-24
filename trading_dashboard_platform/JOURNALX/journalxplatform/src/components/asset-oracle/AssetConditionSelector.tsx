import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";

export type Condition = "Bullish" | "Bearish" | "Consolidating";

interface AssetConditionSelectorProps {
  asset: string;
  condition: Condition | null;
  onConditionChange: (condition: Condition) => void;
}

const conditionConfig: Record<
  Condition,
  { icon: React.ReactNode; color: string }
> = {
  Bullish: {
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    color: "text-green-500",
  },
  Bearish: {
    icon: <TrendingDown className="h-4 w-4 text-red-500" />,
    color: "text-red-500",
  },
  Consolidating: {
    icon: <Minus className="h-4 w-4 text-gray-500" />,
    color: "text-gray-500",
  },
};

const defaultConditionConfig = {
    label: "Select..."
};


const AssetConditionSelector = ({
  asset,
  condition,
  onConditionChange,
}: AssetConditionSelectorProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{asset}</CardTitle>
        {condition && conditionConfig[condition].icon}
      </CardHeader>
      <CardContent>
        <Select
          onValueChange={(value: Condition) => onConditionChange(value)}
          value={condition ?? ""}
        >
          <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder={
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{defaultConditionConfig.label}</span>
                </div>
            }>
              {condition && (
                <div className="flex items-center gap-2">
                  {conditionConfig[condition].icon}
                  <span className={conditionConfig[condition].color}>
                    {condition}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(conditionConfig) as Condition[]).map((cond) => (
              <SelectItem key={cond} value={cond}>
                <div className="flex items-center gap-2">
                  {conditionConfig[cond].icon}
                  <span>{cond}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default AssetConditionSelector;
