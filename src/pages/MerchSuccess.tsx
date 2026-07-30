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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  useEffect(() => {
    if (!orderId || !isSupabaseConfigured) {
      setError('Missing order reference.');
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let cancelled = false;

    const loadOrder = async () => {
      const { data, error: e } = await supabase
        .from('merch_orders')
        .select('id, product_name, size, quantity, unit_price_cents, customer_name, customer_phone, payment_status')
        .eq('id', orderId)
        .maybeSingle();

      if (cancelled) return;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Order not found.');
        setLoading(false);
        return;
      }

      setOrder(data as OrderRow);
      setLoading(false);
    };

    void loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!order || sentWhatsapp) return;

    const total = (order.unit_price_cents * order.quantity) / 100;
    const message = encodeURIComponent(
      `*BASHCUTZ Merch Order Confirmation*\n\n` +
        `Name: ${order.customer_name}\n` +
        `Phone: ${order.customer_phone}\n` +
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

  const status = order ? 'paid' : (statusParam === 'failed' ? 'failed' : statusParam === 'cancelled' ? 'cancelled' : 'pending');

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {loading && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gold" />
            <h1 className="text-2xl font-bold mb-2">Loading order…</h1>
            <p className="text-white/60 text-sm">Please wait while we pull up your order details.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-gold" />
            <h1 className="text-2xl font-bold mb-2">Order Confirmed 🎉</h1>
            <p className="text-white/70 mb-6">Your merch order is confirmed. WhatsApp should open with your order details.</p>
            <Link to="/merch" className="glass-button-primary inline-block">Back to Merch</Link>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">{status === 'failed' ? 'Order Could Not Be Confirmed' : 'Order Cancelled'}</h1>
            <p className="text-white/70 mb-6">Please try again or contact us on WhatsApp for help.</p>
            <button onClick={() => navigate('/merch')} className="glass-button-primary">Try Again</button>
          </>
        )}

        {!loading && status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-gold" />
            <h1 className="text-2xl font-bold mb-2">Almost there…</h1>
            <p className="text-white/70 mb-6">We&apos;re loading your order details. If the page doesn&apos;t update, please refresh or contact us on WhatsApp.</p>
            <button onClick={() => window.location.reload()} className="glass-button-primary mr-2">Refresh</button>
            <Link to="/merch" className="glass-button-secondary inline-block">Back to Merch</Link>
          </>
        )}

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </main>
  );
}
