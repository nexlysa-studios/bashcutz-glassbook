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
  payment_method: 'cash' | 'card' | 'online';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';
};

const WHATSAPP_NUMBER = '27607329632';

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get('bookingId');
  const statusParam = params.get('status'); // 'cancelled' | 'failed' | null

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  // Poll the booking row until payment_status changes from "pending"
  useEffect(() => {
    if (!bookingId || !isSupabaseConfigured) {
      setError('Missing booking reference.');
      setPolling(false);
      return;
    }
    const supabase = getSupabaseClient();
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const { data, error: e } = await supabase
        .from('bookings')
        .select('id, service, date, time, customer_name, customer_phone, payment_method, payment_status')
        .eq('id', bookingId)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
        setPolling(false);
        return;
      }
      if (!data) {
        setError('Booking not found.');
        setPolling(false);
        return;
      }
      setBooking(data as BookingRow);
      const finalised = data.payment_status === 'paid' || data.payment_status === 'failed' || data.payment_status === 'cancelled';
      if (finalised || attempts > 20) {
        setPolling(false);
      } else {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Send WhatsApp confirmation once we see "paid"
  useEffect(() => {
    if (!booking || sentWhatsapp) return;
    if (booking.payment_status !== 'paid') return;

    const extra = bookingId ? sessionStorage.getItem(`bashcutz_booking_${bookingId}`) : null;
    const firstTime = extra ? (JSON.parse(extra)?.firstTimeCutter ? 'YES - send location' : 'NO') : 'NO';

    const message = encodeURIComponent(
      `*BASHCUTZ Booking Confirmation*\n\n` +
      `Name: ${booking.customer_name}\n` +
      `Phone: ${booking.customer_phone}\n` +
      `First Time Cutter: ${firstTime}\n` +
      `Payment: ONLINE (PAID via Yoco)\n` +
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

  const status = booking?.payment_status ?? (statusParam === 'failed' ? 'failed' : statusParam === 'cancelled' ? 'cancelled' : 'pending');

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {polling && status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Confirming Payment…</h1>
            <p className="text-white/60 text-sm">Hold tight while we verify your Yoco payment.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-amber-400" />
            <h1 className="text-2xl font-bold mb-2">Payment Received 🎉</h1>
            <p className="text-white/70 mb-6">Your booking is confirmed. WhatsApp should open with your confirmation message.</p>
            <Link to="/" className="glass-button-primary inline-block">Back Home</Link>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">
              {status === 'failed' ? 'Payment Failed' : 'Payment Cancelled'}
            </h1>
            <p className="text-white/70 mb-6">No charge was made. You can try again or pick a different payment method.</p>
            <button onClick={() => navigate('/')} className="glass-button-primary">Try Again</button>
          </>
        )}

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </main>
  );
}
