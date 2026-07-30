import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Service } from '../components/sections/ServicesSection';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export interface Booking {
  id: string;
  service: Service;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone: string;
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card';

interface BookingContextType {
  bookings: Booking[];
  blockedDays: string[]; // Full days marked as blocked by admin
  blockedTimeSlots: BlockedTimeSlot[];
  isLoading: boolean;
  error: string | null;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'paymentStatus'>) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['paymentStatus']) => Promise<void>;
  getBookingsForDate: (date: string) => Booking[];
  isTimeSlotTaken: (date: string, time: string) => boolean;
  isTimeSlotBlocked: (date: string, time: string) => boolean;
  isDayFullyBooked: (date: string) => boolean;
  isDayBlocked: (date: string) => boolean;
  toggleBlockDay: (date: string) => Promise<void>;
  toggleBlockTimeSlot: (date: string, time: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | null>(null);

// Available time slots
export const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

type BookingRow = {
  id: string;
  service: Service;
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'cash' | 'card';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled' | null;
  created_at: string;
};

type BlockedDayRow = {
  date: string;
};

export type BlockedTimeSlot = {
  date: string;
  time: string;
};

type BlockedTimeSlotRow = {
  date: string;
  time: string;
};

const normalizeDate = (date: string) => date.slice(0, 10);

const mapBookingRowToBooking = (row: BookingRow): Booking => ({
  id: row.id,
  service: row.service,
  date: normalizeDate(row.date),
  time: row.time,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status ?? 'unpaid',
  createdAt: row.created_at,
});

const sortBookings = (items: Booking[]) =>
  [...items].sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return aKey.localeCompare(bKey);
  });

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<BlockedTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setBookings([]);
      setBlockedDays([]);
      setBlockedTimeSlots([]);
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();

      const [bookingsResult, blockedDaysResult, blockedTimeSlotsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, service, date, time, customer_name, customer_phone, payment_method, payment_status, created_at')
          .order('date', { ascending: true })
          .order('time', { ascending: true }),
        supabase
          .from('blocked_days')
          .select('date')
          .order('date', { ascending: true }),
        supabase
          .from('blocked_time_slots')
          .select('date, time')
          .order('date', { ascending: true })
          .order('time', { ascending: true }),
      ]);

      if (bookingsResult.error) {
        throw bookingsResult.error;
      }

      if (blockedDaysResult.error) {
        throw blockedDaysResult.error;
      }

      if (blockedTimeSlotsResult.error) {
        throw blockedTimeSlotsResult.error;
      }

      const mappedBookings = ((bookingsResult.data ?? []) as BookingRow[]).map(mapBookingRowToBooking);
      const mappedBlockedDays = ((blockedDaysResult.data ?? []) as BlockedDayRow[]).map((item) =>
        normalizeDate(item.date),
      );
      const mappedBlockedTimeSlots = ((blockedTimeSlotsResult.data ?? []) as BlockedTimeSlotRow[]).map((item) => ({
        date: normalizeDate(item.date),
        time: item.time,
      }));

      setBookings(sortBookings(mappedBookings));
      setBlockedDays(mappedBlockedDays);
      setBlockedTimeSlots(mappedBlockedTimeSlots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bookings from Supabase.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'paymentStatus'>): Promise<Booking> => {
    const bookingDateTime = new Date(`${normalizeDate(bookingData.date)}T${bookingData.time}:00`);
    if (!Number.isNaN(bookingDateTime.getTime()) && bookingDateTime.getTime() <= Date.now()) {
      throw new Error('This time has already passed. Please pick another time.');
    }

    if (isDayBlocked(bookingData.date)) {
      throw new Error('This day is blocked. Please choose another date.');
    }
    if (isTimeSlotBlocked(bookingData.date, bookingData.time)) {
      throw new Error('This time slot is unavailable. Please pick another time.');
    }

    const supabase = getSupabaseClient();

    const { data, error: insertError } = await supabase
      .from('bookings')
      .insert({
        service: bookingData.service,
        date: normalizeDate(bookingData.date),
        time: bookingData.time,
        customer_name: bookingData.customerName,
        customer_phone: bookingData.customerPhone,
        payment_method: bookingData.paymentMethod,
      })
      .select('id, service, date, time, customer_name, customer_phone, payment_method, payment_status, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('This time slot is already booked. Please pick another time.');
      }
      throw insertError;
    }

    const createdBooking = mapBookingRowToBooking(data as BookingRow);
    setBookings((prev) => sortBookings([...prev, createdBooking]));
    return createdBooking;
  };

  const cancelBooking = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', id);
    if (deleteError) {
      throw deleteError;
    }

    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBookingStatus = async (id: string, status: Booking['paymentStatus']) => {
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_status: status })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, paymentStatus: status } : b)),
    );
  };

  const getBookingsForDate = (date: string): Booking[] => {
    return bookings.filter((b) => b.date === date);
  };

  const isTimeSlotTaken = (date: string, time: string): boolean => {
    const normalizedDate = normalizeDate(date);
    return (
      bookings.some((b) => b.date === normalizedDate && b.time === time) ||
      blockedTimeSlots.some((slot) => slot.date === normalizedDate && slot.time === time)
    );
  };

  const isTimeSlotBlocked = (date: string, time: string): boolean => {
    const normalizedDate = normalizeDate(date);
    return blockedTimeSlots.some((slot) => slot.date === normalizedDate && slot.time === time);
  };

  const isDayFullyBooked = (date: string): boolean => {
    if (isDayBlocked(date)) return true;
    const normalizedDate = normalizeDate(date);
    const takenSlots = new Set(
      bookings
        .filter((booking) => booking.date === normalizedDate && TIME_SLOTS.includes(booking.time))
        .map((booking) => booking.time),
    );
    blockedTimeSlots
      .filter((slot) => slot.date === normalizedDate && TIME_SLOTS.includes(slot.time))
      .forEach((slot) => takenSlots.add(slot.time));
    return takenSlots.size >= TIME_SLOTS.length;
  };

  const isDayBlocked = (date: string): boolean => {
    return blockedDays.includes(normalizeDate(date));
  };

  const toggleBlockDay = async (date: string) => {
    const normalizedDate = normalizeDate(date);
    const supabase = getSupabaseClient();

    if (blockedDays.includes(normalizedDate)) {
      const { error: deleteError } = await supabase.from('blocked_days').delete().eq('date', normalizedDate);
      if (deleteError) {
        throw deleteError;
      }
      setBlockedDays((prev) => prev.filter((d) => d !== normalizedDate));
      return;
    }

    const { error: insertError } = await supabase
      .from('blocked_days')
      .upsert({ date: normalizedDate }, { onConflict: 'date', ignoreDuplicates: true });

    if (insertError) {
      throw insertError;
    }

    setBlockedDays((prev) => [...prev, normalizedDate].sort((a, b) => a.localeCompare(b)));
  };

  const toggleBlockTimeSlot = async (date: string, time: string) => {
    const normalizedDate = normalizeDate(date);
    const supabase = getSupabaseClient();

    if (bookings.some((booking) => booking.date === normalizedDate && booking.time === time)) {
      throw new Error('Cannot block a time slot that already has a booking.');
    }

    const isAlreadyBlocked = blockedTimeSlots.some((slot) => slot.date === normalizedDate && slot.time === time);

    if (isAlreadyBlocked) {
      const { error: deleteError } = await supabase
        .from('blocked_time_slots')
        .delete()
        .eq('date', normalizedDate)
        .eq('time', time);
      if (deleteError) {
        throw deleteError;
      }
      setBlockedTimeSlots((prev) =>
        prev.filter((slot) => !(slot.date === normalizedDate && slot.time === time)),
      );
      return;
    }

    const { error: insertError } = await supabase
      .from('blocked_time_slots')
      .upsert({ date: normalizedDate, time }, { onConflict: 'date,time', ignoreDuplicates: true });

    if (insertError) {
      throw insertError;
    }

    setBlockedTimeSlots((prev) =>
      [...prev, { date: normalizedDate, time }].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      ),
    );
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        blockedDays,
        blockedTimeSlots,
        isLoading,
        error,
        addBooking,
        cancelBooking,
        updateBookingStatus,
        getBookingsForDate,
        isTimeSlotTaken,
        isTimeSlotBlocked,
        isDayFullyBooked,
        isDayBlocked,
        toggleBlockDay,
        toggleBlockTimeSlot,
        refreshData,
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
