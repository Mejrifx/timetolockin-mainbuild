import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CalendarDashboardProps {
  className?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

export const CalendarDashboard = ({ className }: CalendarDashboardProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: ''
  });

  // Update current date every minute to keep it live
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Memoized expensive calculations
  const today = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentDate.getMonth(), [currentDate]);
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

  // Memoized calendar generation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start from Sunday

    const days = [];
    const currentDateForLoop = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(currentDateForLoop));
      currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
    }
    return days;
  }, [currentYear, currentMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasEvents = (date: Date) => {
    return events.some(event => event.date.toDateString() === date.toDateString());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => event.date.toDateString() === date.toDateString());
  };

  // Memoized event handlers
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, currentMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  const handleCreateEvent = useCallback(() => {
    if (newEvent.title.trim()) {
      const event: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title.trim(),
        date: new Date(selectedDate),
        time: newEvent.time || undefined,
        description: newEvent.description.trim() || undefined
      };
      
      setEvents(prev => [...prev, event]);
      setNewEvent({ title: '', time: '', description: '' });
      setShowEventForm(false);
    }
  }, [newEvent, selectedDate]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className={cn("flex-1 p-8 overflow-y-auto bg-black/10", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
              <p className="text-gray-300">
                Plan your days and stay organized with your schedule
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={goToToday}
                variant="outline"
                className="border-green-500/30 text-white hover:bg-green-500/10"
              >
                Today
              </Button>
              <Button
                onClick={() => setShowEventForm(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="xl:col-span-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigateMonth('prev')}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-green-500/10 text-gray-300 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => navigateMonth('next')}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 hover:bg-green-500/10 text-gray-300 hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNamesShort.map(day => (
                  <div key={day} className="text-center text-sm text-gray-400 font-medium py-3">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  const isCurrentMonthDay = isCurrentMonth(date);
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);
                  const hasEventsOnDate = hasEvents(date);

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "calendar-date performance-button h-16 p-2 text-sm rounded-lg transition-colors duration-100 hover:bg-green-500/20 flex flex-col items-center justify-center relative",
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
                      <span className="text-base font-medium">{date.getDate()}</span>
                      {hasEventsOnDate && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Info & Events */}
          <div className="space-y-6">
            {/* Selected Date */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Date</h3>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {selectedDate.getDate()}
                </p>
                <p className="text-white font-medium">
                  {dayNames[selectedDate.getDay()]}
                </p>
                <p className="text-gray-300 text-sm">
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </p>
              </div>
            </div>

            {/* Events for Selected Date */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Events</h3>
                <Button
                  onClick={() => setShowEventForm(true)}
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:bg-green-500/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">No events for this date</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="bg-black/20 rounded-lg p-3 border border-green-500/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{event.title}</h4>
                          {event.time && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400 text-xs">{event.time}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-gray-300 text-sm mt-2">{event.description}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDeleteEvent(event.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Creation Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Create Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Event Title</label>
                  <Input
                    placeholder="Enter event title..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Time (Optional)</label>
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Description (Optional)</label>
                  <Input
                    placeholder="Add event description..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateEvent}
                  className="bg-green-500 hover:bg-green-600 text-white flex-1"
                >
                  Create Event
                </Button>
                <Button
                  onClick={() => setShowEventForm(false)}
                  variant="outline"
                  className="border-green-500/30 text-white hover:bg-green-500/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
