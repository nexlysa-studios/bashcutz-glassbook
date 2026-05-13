import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { Calendar, Users, X, ChevronLeft, ChevronRight, Lock, Unlock, LogOut, ShoppingBag, ArrowRight, CreditCard, Banknote, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassNavbar } from '../components/layout/GlassNavbar';
import { useBooking, Booking, TIME_SLOTS } from '../context/BookingContext';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { to12HourTime } from '@/lib/time';
import { fetchMerchOrders, formatRand, MerchOrderRow } from '@/lib/merchOrders';

export default function AdminDashboard() {
  const { bookings, cancelBooking, blockedDays, toggleBlockDay, isLoading, error, isTimeSlotBlocked, toggleBlockTimeSlot } = useBooking();
  useSEO({
    title: 'Admin Dashboard | BASHCUTZ WorldWide',
    description: 'Private booking dashboard for BASHCUTZ WorldWide.',
    path: '/admin',
    robots: 'noindex, nofollow',
  });

  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [recentMerch, setRecentMerch] = useState<MerchOrderRow[]>([]);
  const [merchLoading, setMerchLoading] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.admin-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMerchOrders({ sinceDays: 7 });
        if (!cancelled) setRecentMerch(data);
      } catch {
        // ignore — section will just show empty
      } finally {
        if (!cancelled) setMerchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();

  const getBookingsForDate = (dateStr: string): Booking[] => {
    return bookings.filter((b) => b.date === dateStr);
  };

  const todayBookings = bookings.filter(
    (b) => b.date === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingBookings = bookings
    .filter((b) => parseISO(b.date) >= new Date())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 5);

  const handleCancelBooking = async (booking: Booking) => {
    if (confirm(`Cancel booking for ${booking.customerName}?`)) {
      try {
        await cancelBooking(booking.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel booking.';
        alert(message);
      }
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <GlassNavbar />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <span className="text-gold text-sm font-medium tracking-widest uppercase mb-2 block">
                Dashboard
              </span>
              <h1 className="text-3xl md:text-4xl font-bold">Admin Panel</h1>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>

          {/* Stats Grid */}
          {isLoading && <p className="mb-6 text-white/60">Loading bookings...</p>}
          {error && !isLoading && <p className="mb-6 text-red-300">{error}</p>}

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="admin-card glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Today's Bookings</p>
                  <p className="text-2xl font-bold text-gold">{todayBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="admin-card glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </div>

            <div className="admin-card glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Blocked Days</p>
                  <p className="text-2xl font-bold">{blockedDays.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Calendar */}
            <div className="admin-card glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Calendar</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium w-32 text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs text-white/40 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-12" />
                ))}
                {days.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayBookings = getBookingsForDate(dateStr);
                  const isBlocked = blockedDays.includes(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`
                        h-12 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200 tap-feedback
                        ${isSelected ? 'bg-gold text-black' : isBlocked ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'}
                        ${isToday && !isSelected ? 'ring-1 ring-gold/50' : ''}
                      `}
                    >
                      <span className="font-medium">{format(date, 'd')}</span>
                      {dayBookings.length > 0 && !isBlocked && (
                        <span className={`text-xs ${isSelected ? 'text-black/60' : 'text-gold'}`}>
                          {dayBookings.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Block/Unblock selected day */}
              {selectedDate && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={async () => {
                      try {
                        await toggleBlockDay(selectedDate);
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Failed to update blocked day.';
                        alert(message);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-colors tap-feedback ${
                      blockedDays.includes(selectedDate)
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    }`}
                  >
                    {blockedDays.includes(selectedDate) ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        Unblock {format(parseISO(selectedDate), 'MMM d')}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Block {format(parseISO(selectedDate), 'MMM d')}
                      </>
                    )}
                  </button>

                  <div className="mt-4">
                    <p className="text-sm text-white/60 mb-3">
                      Block Hours ({format(parseISO(selectedDate), 'MMM d')})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((time) => {
                        const hasBooking = getBookingsForDate(selectedDate).some((booking) => booking.time === time);
                        const blocked = isTimeSlotBlocked(selectedDate, time);

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={hasBooking}
                            onClick={async () => {
                              try {
                                await toggleBlockTimeSlot(selectedDate, time);
                              } catch (err) {
                                const message = err instanceof Error ? err.message : 'Failed to update blocked time slot.';
                                alert(message);
                              }
                            }}
                            className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                              hasBooking
                                ? 'cursor-not-allowed bg-white/5 text-white/30'
                                : blocked
                                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {to12HourTime(time)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-white/40">
                      Red = blocked, dim = booked
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bookings List */}
            <div className="admin-card glass-card p-6">
              <h2 className="text-xl font-semibold mb-6">
                {selectedDate
                  ? `Bookings for ${format(parseISO(selectedDate), 'MMM d, yyyy')}`
                  : 'Upcoming Bookings'}
              </h2>

              <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
                {(selectedDate ? getBookingsForDate(selectedDate) : upcomingBookings).length === 0 ? (
                  <p className="text-white/40 text-center py-8">No bookings</p>
                ) : (
                  (selectedDate ? getBookingsForDate(selectedDate) : upcomingBookings).map(
                    (booking) => (
                      <div
                        key={booking.id}
                        className="glass-card p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-white/50">{booking.customerPhone}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                            <span className="text-gold">{booking.service.name}</span>
                            <span>•</span>
                            <span>{to12HourTime(booking.time)}</span>
                            {!selectedDate && (
                              <>
                                <span>•</span>
                                <span>{format(parseISO(booking.date), 'MMM d')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => void handleCancelBooking(booking)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors tap-feedback"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
