import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

type OrderRow = {
  id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
  customer_name: string;
  customer_phone: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';
};

const WHATSAPP_NUMBER = '27607329632';

export default function MerchSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('orderId');
  const statusParam = params.get('status');

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  useEffect(() => {
    if (!orderId || !isSupabaseConfigured) {
      setError('Missing order reference.');
      setPolling(false);
      return;
    }
    const supabase = getSupabaseClient();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    let cancelled = false;
    let attempts = 0;

    const verifyWithYoco = async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/yoco-verify-merch-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({ orderId }),
        });
      } catch (err) {
        console.warn('yoco-verify-merch-payment failed', err);
      }
    };

    const tick = async () => {
      attempts += 1;
      if (attempts === 1 || attempts % 3 === 0) {
        await verifyWithYoco();
      }
      const { data, error: e } = await supabase
        .from('merch_orders')
        .select('id, product_name, size, quantity, unit_price_cents, customer_name, customer_phone, payment_status')
        .eq('id', orderId)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
        setPolling(false);
        return;
      }
      if (!data) {
        setError('Order not found.');
        setPolling(false);
        return;
      }
      setOrder(data as OrderRow);
      const finalised = data.payment_status === 'paid' || data.payment_status === 'failed' || data.payment_status === 'cancelled';
      if (finalised || attempts > 30) {
        setPolling(false);
      } else {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!order || sentWhatsapp) return;
    if (order.payment_status !== 'paid') return;

    const total = (order.unit_price_cents * order.quantity) / 100;
    const message = encodeURIComponent(
      `*BASHCUTZ Merch Order Confirmation*\n\n` +
        `Name: ${order.customer_name}\n` +
        `Phone: ${order.customer_phone}\n` +
        `Payment: ONLINE (PAID via Yoco)\n` +
        `Product: ${order.product_name}\n` +
        `Size: ${order.size}\n` +
        `Quantity: ${order.quantity}\n` +
        `Total: R${total.toFixed(2)}\n\n` +
        `Collection address will be shared here.`,
    );
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${message}`
      : `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    setSentWhatsapp(true);
    if (isMobile) window.location.replace(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }, [order, sentWhatsapp]);

  const status =
    order?.payment_status ??
    (statusParam === 'failed' ? 'failed' : statusParam === 'cancelled' ? 'cancelled' : 'pending');

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {polling && status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gold" />
            <h1 className="text-2xl font-bold mb-2">Confirming Payment…</h1>
            <p className="text-white/60 text-sm">Hold tight while we verify your Yoco payment.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-gold" />
            <h1 className="text-2xl font-bold mb-2">Payment Received 🎉</h1>
            <p className="text-white/70 mb-6">
              Your merch order is confirmed. WhatsApp should open with your order details.
            </p>
            <Link to="/merch" className="glass-button-primary inline-block">Back to Merch</Link>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">
              {status === 'failed' ? 'Payment Failed' : 'Payment Cancelled'}
            </h1>
            <p className="text-white/70 mb-6">No charge was made. You can try again from the merch page.</p>
            <button onClick={() => navigate('/merch')} className="glass-button-primary">Try Again</button>
          </>
        )}

        {!polling && status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-gold" />
            <h1 className="text-2xl font-bold mb-2">Still Confirming…</h1>
            <p className="text-white/70 mb-6">
              Your payment is taking longer than expected. If money was deducted, your order will be confirmed shortly.
            </p>
            <button onClick={() => window.location.reload()} className="glass-button-primary mr-2">
              Refresh
            </button>
            <Link to="/merch" className="glass-button-secondary inline-block">Back to Merch</Link>
          </>
        )}

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </main>
  );
}
