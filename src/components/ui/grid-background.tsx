import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from './background-beams';

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const GridBackground = ({ children, className }: GridBackgroundProps) => {
  const isMobile = useMemo(() => typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent), []);
  return (
    <div 
      className={cn(
        "relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900",
        className
      )}
    >
      {/* Background Beams Animation */}
      <BackgroundBeams className={cn(isMobile ? 'opacity-85' : 'opacity-100')} />
      
      {/* Subtle overlay for better content readability */}
      <div className="absolute inset-0 bg-black/10 z-10 will-change-opacity pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};