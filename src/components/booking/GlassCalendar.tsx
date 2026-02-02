import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { useBooking } from '../../context/BookingContext';

interface GlassCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function GlassCalendar({ selectedDate, onSelectDate }: GlassCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { isDayFullyBooked, isDayBlocked } = useBooking();

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDay = startOfMonth(currentMonth).getDay();

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    
    // Check if weekend (optional - uncomment if barber doesn't work weekends)
    // const dayOfWeek = date.getDay();
    // if (dayOfWeek === 0) return true; // Sunday
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return isDayFullyBooked(dateStr) || isDayBlocked(dateStr);
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs text-white/40 font-medium py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10" />
        ))}

        {/* Day cells */}
        {days.map((date) => {
          const disabled = isDateDisabled(date);
          const selected = selectedDate && isSameDay(date, selectedDate);
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => !disabled && onSelectDate(date)}
              disabled={disabled}
              className={`
                calendar-day text-sm font-medium transition-all duration-200
                ${disabled ? 'calendar-day-disabled' : ''}
                ${selected ? 'calendar-day-selected' : ''}
                ${today && !selected ? 'calendar-day-today' : ''}
              `}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/90" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/5 opacity-30" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
