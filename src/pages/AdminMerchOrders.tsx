import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { useSEO } from '@/hooks/useSEO';
import { fetchMerchOrders, formatRand, MerchOrderRow } from '@/lib/merchOrders';

const STATUS_STYLES: Record<MerchOrderRow['payment_status'], string> = {
  paid: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
  unpaid: 'bg-white/10 text-white/60 border border-white/20',
  failed: 'bg-red-500/20 text-red-300 border border-red-400/30',
  cancelled: 'bg-red-500/10 text-red-300 border border-red-400/20',
};

export default function AdminMerchOrders() {
  useSEO({
    title: 'Merch Orders | BASHCUTZ Admin',
    description: 'Admin view of all merchandise orders.',
    path: '/admin/merch-orders',
    robots: 'noindex, nofollow',
  });

  const [orders, setOrders] = useState<MerchOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | MerchOrderRow['payment_status']>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMerchOrders();
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load merch orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.payment_status === filter);
  const totalRevenueCents = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.payment_amount_cents ?? o.unit_price_cents * o.quantity), 0);
  const paidCount = orders.filter((o) => o.payment_status === 'paid').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <GlassNavbar />
      <main className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mt-4 mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Merch Orders</h1>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="glass-card p-5">
              <p className="text-white/50 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-white/50 text-sm">Paid Orders</p>
              <p className="text-2xl font-bold text-gold">{paidCount}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-white/50 text-sm">Revenue (Paid)</p>
              <p className="text-2xl font-bold text-gold">{formatRand(totalRevenueCents)}</p>
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

            {loading && <p className="text-white/60 text-sm py-8 text-center">Loading orders…</p>}
            {error && !loading && <p className="text-red-300 text-sm py-8 text-center">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <div className="py-12 text-center text-white/40">
                <Package className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p>No orders found.</p>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Customer</th>
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Size</th>
                      <th className="py-3 pr-4">Qty</th>
                      <th className="py-3 pr-4">Total</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => {
                      const total = (o.payment_amount_cents ?? o.unit_price_cents * o.quantity);
                      return (
                        <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 pr-4 text-white/70 whitespace-nowrap">
                            {format(parseISO(o.created_at), 'MMM d, HH:mm')}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="font-medium">{o.customer_name}</div>
                            <div className="text-xs text-white/50">{o.customer_phone}</div>
                          </td>
                          <td className="py-3 pr-4 text-white/80">{o.product_name}</td>
                          <td className="py-3 pr-4 text-white/70">{o.size}</td>
                          <td className="py-3 pr-4 text-white/70">{o.quantity}</td>
                          <td className="py-3 pr-4 font-semibold text-gold">{formatRand(total)}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[o.payment_status]}`}>
                              {o.payment_status}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-white/40 font-mono truncate max-w-[140px]">
                            {o.payment_reference ?? '—'}
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
