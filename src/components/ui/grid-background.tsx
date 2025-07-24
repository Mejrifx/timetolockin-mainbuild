import React from 'react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from './background-beams';

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const GridBackground = ({ children, className }: GridBackgroundProps) => {
  return (
    <div 
      className={cn(
        "relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900",
        className
      )}
    >
      {/* Background Beams Animation */}
      <BackgroundBeams />
      
      {/* Subtle overlay for better content readability */}
      <div className="absolute inset-0 bg-black/30 z-10" />
      
      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};