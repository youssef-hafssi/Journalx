
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TextAnimate } from "@/components/ui/text-animate";

interface KpiCardProps {
  title: string;
  value: string;
  numericValue?: number; // Add numeric value for animation
  details?: string;
  children?: React.ReactNode;
  valueClassName?: string;
  variant?: "default" | "enhanced";
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  animateValue?: boolean; // Control whether to animate the value
}

const KpiCard = ({ 
  title, 
  value, 
  numericValue,
  details, 
  children, 
  valueClassName, 
  variant = "default",
  trend,
  icon,
  animateValue = false
}: KpiCardProps) => {
  const isEnhanced = variant === "enhanced";
  
  return (
    <Card className={cn(
      "h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group",
      isEnhanced ? 
        "bg-gradient-to-br from-card via-card to-card/95 border-border/60 shadow-md backdrop-blur-sm" : 
        "bg-card border-border/50 shadow-sm"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <TextAnimate 
            animation="blurInUp" 
            className={cn(
              "font-medium tracking-tight uppercase text-xs leading-tight",
              isEnhanced ? "text-muted-foreground/80" : "text-muted-foreground"
            )}
            by="word"
            once
            as="h3"
          >
            {title}
          </TextAnimate>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <div className={cn(
            "font-bold tracking-tight leading-none",
            isEnhanced ? "text-3xl" : "text-2xl",
            valueClassName
          )}>
            {animateValue && numericValue !== undefined ? (
              <NumberTicker 
                value={numericValue} 
                className="font-bold tracking-tight"
                decimalPlaces={value.includes('.') ? 2 : 0}
              />
            ) : (
              <TextAnimate 
                animation="scaleUp" 
                by="character"
                once
                delay={0.2}
              >
                {value}
              </TextAnimate>
            )}
          </div>
          {trend && (
            <Badge 
              variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
              className="text-xs px-2 py-1 ml-auto"
            >
              {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
            </Badge>
          )}
        </div>
        
        {/* Details */}
        {details && (
          <p className={cn(
            "text-xs leading-relaxed",
            isEnhanced ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {details}
          </p>
        )}
        
        {/* Additional Content */}
        {children && (
          <div className="pt-2">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
