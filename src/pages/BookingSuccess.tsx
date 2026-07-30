import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { to12HourTime } from '@/lib/time';
import { format, parseISO } from 'date-fns';

type BookingRow = {
  id: string;
  service: { name: string; price: number };
  date: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  payment_method: 'cash' | 'card';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';
};

const WHATSAPP_NUMBER = '27607329632';

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get('bookingId');
  const statusParam = params.get('status');

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  useEffect(() => {
    if (!bookingId || !isSupabaseConfigured) {
      setError('Missing booking reference.');
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let cancelled = false;

    const loadBooking = async () => {
      const { data, error: e } = await supabase
        .from('bookings')
        .select('id, service, date, time, customer_name, customer_phone, payment_method, payment_status')
        .eq('id', bookingId)
        .maybeSingle();

      if (cancelled) return;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Booking not found.');
        setLoading(false);
        return;
      }

      setBooking(data as BookingRow);
      setLoading(false);
    };

    void loadBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!booking || sentWhatsapp) return;

    const extra = bookingId ? sessionStorage.getItem(`bashcutz_booking_${bookingId}`) : null;
    const firstTime = extra ? (JSON.parse(extra)?.firstTimeCutter ? 'YES - send location' : 'NO') : 'NO';

    const message = encodeURIComponent(
      `*BASHCUTZ Booking Confirmation*\n\n` +
        `Name: ${booking.customer_name}\n` +
        `Phone: ${booking.customer_phone}\n` +
        `First Time Cutter: ${firstTime}\n` +
        `Payment: ${booking.payment_method.toUpperCase()}\n` +
        `Service: ${booking.service.name}\n` +
        `Date: ${format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}\n` +
        `Time: ${to12HourTime(booking.time)}\n` +
        `Price: R${booking.service.price}`,
    );
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${message}`
      : `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    setSentWhatsapp(true);
    if (isMobile) window.location.replace(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }, [booking, bookingId, sentWhatsapp]);

  const status = booking ? 'paid' : (statusParam === 'failed' ? 'failed' : statusParam === 'cancelled' ? 'cancelled' : 'pending');

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {loading && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Loading booking…</h1>
            <p className="text-white/60 text-sm">Please wait while we pull up your booking details.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed 🎉</h1>
            <p className="text-white/70 mb-6">Your booking is confirmed. WhatsApp should open with your confirmation message.</p>
            <Link to="/" className="glass-button-primary inline-block">Back Home</Link>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">
              {status === 'failed' ? 'Booking Could Not Be Confirmed' : 'Booking Cancelled'}
            </h1>
            <p className="text-white/70 mb-6">Please try again or contact us on WhatsApp for help.</p>
            <button onClick={() => navigate('/')} className="glass-button-primary">Try Again</button>
          </>
        )}

        {!loading && status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Almost there…</h1>
            <p className="text-white/70 mb-6">We&apos;re loading your booking details. If the page doesn&apos;t update, please refresh or contact us on WhatsApp.</p>
            <button onClick={() => window.location.reload()} className="glass-button-primary mr-2">Refresh</button>
            <Link to="/" className="glass-button-secondary inline-block">Back Home</Link>
          </>
        )}

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </main>
  );
}
