import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarProps {
  className?: string;
}

export const Calendar = ({ className }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Update current date every minute to keep it live
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start from Sunday

  // Generate calendar days
  const calendarDays = [];
  const currentDateForLoop = new Date(startDate);

  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    calendarDays.push(new Date(currentDateForLoop));
    currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <div className={cn("bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 p-4", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-green-400" />
          <h3 className="text-white font-medium text-sm">Calendar</h3>
        </div>
        <Button
          onClick={goToToday}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-green-500/10 transition-colors"
        >
          Today
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => navigateMonth('prev')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-green-500/10 text-gray-300 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <h4 className="text-white font-medium text-sm">
            {monthNames[currentMonth]} {currentYear}
          </h4>
        </div>

        <Button
          onClick={() => navigateMonth('next')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-green-500/10 text-gray-300 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "h-8 w-8 text-xs rounded-md transition-colors duration-75 hover:bg-green-500/20 flex items-center justify-center transform-gpu will-change-contents",
                {
                  // Current month days
                  "text-white": isCurrentMonthDay,
                  // Other month days (grayed out)
                  "text-gray-500": !isCurrentMonthDay,
                  // Today
                  "bg-green-500 text-white font-bold hover:bg-green-600": isTodayDate,
                  // Selected date (not today)
                  "bg-green-500/30 text-white border border-green-500/50": isSelectedDate && !isTodayDate,
                  // Hover effect for current month days
                  "hover:text-white": isCurrentMonthDay && !isTodayDate,
                }
              )}
              disabled={!isCurrentMonthDay}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-green-500/20">
          <div className="text-center">
            <p className="text-xs text-gray-400">Selected</p>
            <p className="text-sm text-white font-medium">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
