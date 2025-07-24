
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type Trade } from "./RecentTrades";
import AddTradeForm, { type FormValues } from "./AddTradeForm";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { TextAnimate } from "@/components/ui/text-animate";

const Header = ({ onAddTrade }: { onAddTrade: (trade: FormValues) => void }) => {
    const [open, setOpen] = React.useState(false);
    
    return (
        <header className="relative">
          {/* Professional Header Card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              
              {/* Left Section - Title & Description */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                      <AnimatedGradientText 
                        speed={0.5}
                        colorFrom="#8B5CF6" 
                        colorTo="#06B6D4"
                        className="text-3xl lg:text-4xl font-bold tracking-tight"
                      >
                        Trading Dashboard
                      </AnimatedGradientText>
                    </h1>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-medium">
                        <TextAnimate animation="slideLeft" by="character" delay={0.5} once>
                          Live Data
                        </TextAnimate>
                      </Badge>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
                
                <TextAnimate 
                  animation="blurInUp" 
                  className="text-muted-foreground text-base max-w-2xl leading-relaxed"
                  by="word"
                  delay={0.3}
                  once
                  as="p"
                >
                  Comprehensive performance analytics with real-time insights and detailed trading metrics for informed decision making.
                </TextAnimate>
              </div>
              
              {/* Right Section - Action Button */}
              <div className="flex items-center justify-end lg:justify-center">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium"
                    >
                      <Plus className="mr-2 h-5 w-5" /> 
                      Add Trade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl">
                    <DialogHeader className="space-y-3 pb-6">
                      <DialogTitle className="text-2xl font-bold tracking-tight">Add New Trade</DialogTitle>
                      <DialogDescription className="text-base text-muted-foreground">
                        Record your trade details to maintain accurate performance tracking and analysis.
                      </DialogDescription>
                    </DialogHeader>
                    <AddTradeForm onAddTrade={onAddTrade} setOpen={setOpen} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>
    );
};

export default Header;
