import { useEffect, useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { TIME_SLOTS, useBooking } from '../../context/BookingContext';
import { to12HourTime } from '@/lib/time';

interface TimeSlotSelectorProps {
  selectedDate: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  onSelectAfterHours: () => void;
}

export function TimeSlotSelector({
  selectedDate,
  selectedTime,
  onSelectTime,
  onSelectAfterHours,
}: TimeSlotSelectorProps) {
  const { isTimeSlotTaken } = useBooking();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const visibleTimeSlots = useMemo(() => {
    return TIME_SLOTS.filter((time) => {
      if (!isSameDay(selectedDate, now)) return true;
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime.getTime() > now.getTime();
    });
  }, [now, selectedDate]);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">
        Select Time
      </h3>
      <p className="text-sm text-white/50 mb-6">
        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {visibleTimeSlots.map((time) => {
          const isTaken = isTimeSlotTaken(dateStr, time);
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              onClick={() => !isTaken && onSelectTime(time)}
              disabled={isTaken}
              className={`
                time-slot tap-feedback
                ${isSelected ? 'time-slot-selected' : ''}
                ${isTaken ? 'time-slot-disabled' : ''}
              `}
            >
              {to12HourTime(time)}
            </button>
          );
        })}
      </div>
      {visibleTimeSlots.length === 0 && (
        <p className="mt-4 text-sm text-white/50 text-center">
          No standard hours left for today.
        </p>
      )}

      <button
        type="button"
        onClick={onSelectAfterHours}
        className="w-full mt-5 glass-button tap-feedback text-sm font-medium"
      >
        Request After-Hours Booking
      </button>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/90" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/10 border border-white/10" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/5 opacity-30" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
