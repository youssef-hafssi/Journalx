"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Particles } from "@/components/ui/particles";

interface AnimatedLoadingProps {
  className?: string;
}

export function AnimatedLoading({ className }: AnimatedLoadingProps) {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

  return (
    <div className={`relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background ${className}`}>
      <div className="relative z-10 text-center">
        <div className="mb-4 text-6xl font-bold tracking-tight animate-pulse">
          Journal<span className="text-red-600">X</span>
        </div>
        <div className="text-lg text-muted-foreground animate-bounce">
          Loading your trading dashboard...
        </div>
      </div>
      
      <Particles
        className="absolute inset-0 z-0"
        quantity={60}
        ease={80}
        color={color}
        refresh
      />
    </div>
  );
}
