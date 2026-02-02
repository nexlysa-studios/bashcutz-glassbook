import { format } from 'date-fns';
import { TIME_SLOTS, useBooking } from '../../context/BookingContext';

interface TimeSlotSelectorProps {
  selectedDate: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSlotSelector({ selectedDate, selectedTime, onSelectTime }: TimeSlotSelectorProps) {
  const { isTimeSlotTaken } = useBooking();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">
        Select Time
      </h3>
      <p className="text-sm text-white/50 mb-6">
        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {TIME_SLOTS.map((time) => {
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
              {time}
            </button>
          );
        })}
      </div>

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
          <span>Taken</span>
        </div>
      </div>
    </div>
  );
}
