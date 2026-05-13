import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, CreditCard, Banknote, Globe } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { useSEO } from '@/hooks/useSEO';
import { useBooking, Booking } from '@/context/BookingContext';
import { to12HourTime } from '@/lib/time';

const STATUS_STYLES: Record<Booking['paymentStatus'], string> = {
  paid: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
  unpaid: 'bg-white/10 text-white/60 border border-white/20',
  failed: 'bg-red-500/20 text-red-300 border border-red-400/30',
  cancelled: 'bg-red-500/10 text-red-300 border border-red-400/20',
};

export default function AdminBookings() {
  useSEO({
    title: 'Bookings | BASHCUTZ Admin',
    description: 'Admin view of all bookings.',
    path: '/admin/bookings',
    robots: 'noindex, nofollow',
  });

  const { bookings, isLoading, error, updateBookingStatus } = useBooking();
  const [filter, setFilter] = useState<'all' | Booking['paymentStatus']>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<Booking['paymentStatus'] | null>(null);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.paymentStatus === filter);
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.service.price, 0);
  const paidCount = bookings.filter((b) => b.paymentStatus === 'paid').length;

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['paymentStatus']) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setEditingId(null);
      setEditingStatus(null);
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <GlassNavbar />
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
              </Link>
              <span className="text-gold text-sm font-medium tracking-widest uppercase mb-2 block">Admin</span>
              <h1 className="text-3xl md:text-4xl font-bold">Bookings</h1>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Paid Bookings</p>
                  <p className="text-2xl font-bold text-gold">{paidCount}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Revenue (Paid)</p>
                  <p className="text-2xl font-bold text-gold">R{totalRevenue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(['all', 'paid', 'pending', 'unpaid', 'failed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                    filter === f ? 'bg-gold text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {isLoading && <p className="text-white/60 text-sm py-8 text-center">Loading bookings…</p>}
            {error && !isLoading && <p className="text-red-300 text-sm py-8 text-center">{error}</p>}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="py-12 text-center text-white/40">
                <Calendar className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p>No bookings found.</p>
              </div>
            )}

            {!isLoading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Customer</th>
                      <th className="py-3 pr-4">Service</th>
                      <th className="py-3 pr-4">Payment</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered
                      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
                      .map((b) => {
                        const MethodIcon = b.paymentMethod === 'online' ? Globe : b.paymentMethod === 'card' ? CreditCard : Banknote;
                        const methodLabel = b.paymentMethod === 'online' ? 'Online (Yoco)' : b.paymentMethod === 'card' ? 'Card' : 'Cash';
                        return (
                          <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 pr-4 text-white/70 whitespace-nowrap">
                              {format(parseISO(b.date), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 pr-4 text-white/70 whitespace-nowrap">
                              {to12HourTime(b.time)}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="font-medium">{b.customerName}</div>
                              <div className="text-xs text-white/50">{b.customerPhone}</div>
                            </td>
                            <td className="py-3 pr-4 text-white/80">{b.service.name}</td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/5 text-white/70 border border-white/10">
                                <MethodIcon className="w-3 h-3" />
                                {methodLabel}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              {editingId === b.id && (b.paymentMethod === 'cash' || b.paymentMethod === 'card') ? (
                                <div className="flex gap-2">
                                  <select
                                    value={editingStatus || b.paymentStatus}
                                    onChange={(e) => setEditingStatus(e.target.value as Booking['paymentStatus'])}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-neutral-800 text-white border border-gold focus:outline-none focus:ring-2 focus:ring-gold/50 transition"
                                  >
                                    <option value="pending" className="bg-neutral-800 text-white">Pending</option>
                                    <option value="paid" className="bg-neutral-800 text-white">Paid</option>
                                    <option value="unpaid" className="bg-neutral-800 text-white">Unpaid</option>
                                    <option value="failed" className="bg-neutral-800 text-white">Failed</option>
                                    <option value="cancelled" className="bg-neutral-800 text-white">Cancelled</option>
                                  </select>
                                  <button
                                    onClick={() => handleStatusUpdate(b.id, editingStatus || b.paymentStatus)}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-gold text-black hover:bg-gold/90 transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingStatus(null);
                                    }}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (b.paymentMethod === 'cash' || b.paymentMethod === 'card') ? (
                                <button
                                  onClick={() => {
                                    setEditingId(b.id);
                                    setEditingStatus(b.paymentStatus);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition ${STATUS_STYLES[b.paymentStatus]}`}
                                >
                                  {b.paymentStatus}
                                </button>
                              ) : (
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[b.paymentStatus]}`}>
                                  {b.paymentStatus}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}