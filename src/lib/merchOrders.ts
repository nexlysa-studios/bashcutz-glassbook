import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type MerchOrderRow = {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
  customer_name: string;
  customer_phone: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_reference: string | null;
  payment_amount_cents: number | null;
  paid_at: string | null;
  created_at: string;
};

export async function fetchMerchOrders(opts?: { sinceDays?: number; paidOnly?: boolean }) {
  if (!isSupabaseConfigured) return [] as MerchOrderRow[];
  const supabase = getSupabaseClient();
  let query = supabase
    .from('merch_orders')
    .select(
      'id, product_id, product_name, size, quantity, unit_price_cents, customer_name, customer_phone, payment_status, payment_reference, payment_amount_cents, paid_at, created_at',
    )
    .order('created_at', { ascending: false });

  if (opts?.sinceDays) {
    const since = new Date(Date.now() - opts.sinceDays * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', since);
  }
  if (opts?.paidOnly) {
    query = query.eq('payment_status', 'paid');
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MerchOrderRow[];
}

export function formatRand(cents: number) {
  return `R${(cents / 100).toFixed(2)}`;
}
