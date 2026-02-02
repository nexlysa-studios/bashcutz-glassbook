import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Service } from '../components/sections/ServicesSection';

export interface Booking {
  id: string;
  service: Service;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  blockedDays: string[]; // Full days marked as blocked by admin
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string) => void;
  getBookingsForDate: (date: string) => Booking[];
  isTimeSlotTaken: (date: string, time: string) => boolean;
  isDayFullyBooked: (date: string) => boolean;
  isDayBlocked: (date: string) => boolean;
  toggleBlockDay: (date: string) => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

// Available time slots
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const STORAGE_KEY = 'bashcutz_bookings';
const BLOCKED_DAYS_KEY = 'bashcutz_blocked_days';

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [blockedDays, setBlockedDays] = useState<string[]>(() => {
    const stored = localStorage.getItem(BLOCKED_DAYS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Persist bookings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  // Persist blocked days to localStorage
  useEffect(() => {
    localStorage.setItem(BLOCKED_DAYS_KEY, JSON.stringify(blockedDays));
  }, [blockedDays]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [...prev, newBooking]);
    return newBooking;
  };

  const cancelBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const getBookingsForDate = (date: string): Booking[] => {
    return bookings.filter((b) => b.date === date);
  };

  const isTimeSlotTaken = (date: string, time: string): boolean => {
    return bookings.some((b) => b.date === date && b.time === time);
  };

  const isDayFullyBooked = (date: string): boolean => {
    if (isDayBlocked(date)) return true;
    const dateBookings = getBookingsForDate(date);
    return dateBookings.length >= TIME_SLOTS.length;
  };

  const isDayBlocked = (date: string): boolean => {
    return blockedDays.includes(date);
  };

  const toggleBlockDay = (date: string) => {
    setBlockedDays((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        blockedDays,
        addBooking,
        cancelBooking,
        getBookingsForDate,
        isTimeSlotTaken,
        isDayFullyBooked,
        isDayBlocked,
        toggleBlockDay,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
