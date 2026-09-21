import { getSupabaseClient } from '@/lib/supabase';

export type NewsletterCampaignType =
  | 'general'
  | 'price_update'
  | 'promotion'
  | 'announcement'
  | 'holiday_hours';

export type NewsletterCampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export type NewsletterSubscriber = {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsletterCampaign = {
  id: string;
  subject: string;
  title: string;
  body: string;
  type: NewsletterCampaignType;
  status: NewsletterCampaignStatus;
  recipient_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  send_error: string | null;
};

export type CampaignDraft = Pick<NewsletterCampaign, 'subject' | 'title' | 'body' | 'type'>;

export const campaignTypeLabels: Record<NewsletterCampaignType, string> = {
  general: 'General',
  price_update: 'Price Update',
  promotion: 'Promotion',
  announcement: 'Announcement',
  holiday_hours: 'Holiday Hours',
};

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  const normalized = normalizeNewsletterEmail(email);
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalized);
}

function functionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context instanceof Response) {
      return context.clone().json()
        .then((body: { error?: string }) => body.error || fallback)
        .catch(() => fallback);
    }
  }
  return Promise.resolve(fallback);
}

export async function subscribeToNewsletter(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
    body: { email: normalizeNewsletterEmail(email) },
  });
  if (error) throw new Error(await functionErrorMessage(error, "We couldn't subscribe you right now. Please try again."));
  if (data?.error) throw new Error(data.error);
  return data as { ok: true; state: string; message: string };
}

export async function unsubscribeFromNewsletter(token: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('newsletter-unsubscribe', {
    body: { token },
  });
  if (error) throw new Error(await functionErrorMessage(error, "We couldn't update your preference right now."));
  if (data?.error) throw new Error(data.error);
  return data as { ok: true; message: string };
}

export async function fetchNewsletterOverview() {
  const supabase = getSupabaseClient();
  const [active, unsubscribed, campaigns, sent] = await Promise.all([
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'subscribed'),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'unsubscribed'),
    supabase.from('newsletter_campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('newsletter_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
  ]);
  const error = active.error || unsubscribed.error || campaigns.error || sent.error;
  if (error) throw error;
  return {
    activeSubscribers: active.count ?? 0,
    unsubscribed: unsubscribed.count ?? 0,
    totalCampaigns: campaigns.count ?? 0,
    campaignsSent: sent.count ?? 0,
  };
}

export async function fetchNewsletterSubscribers(search = '', status = 'all') {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('newsletter_subscribers')
    .select('id,email,status,subscribed_at,unsubscribed_at,created_at,updated_at')
    .order('subscribed_at', { ascending: false })
    .limit(500);
  const normalizedSearch = search.trim().replace(/[%_,()]/g, '');
  if (normalizedSearch) query = query.ilike('email', `%${normalizedSearch}%`);
  if (status === 'subscribed' || status === 'unsubscribed') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NewsletterSubscriber[];
}

export async function fetchNewsletterCampaigns() {
  const { data, error } = await getSupabaseClient()
    .from('newsletter_campaigns')
    .select('id,subject,title,body,type,status,recipient_count,created_by,created_at,updated_at,sent_at,send_error')
    .order('created_at', { ascending: false })
    .limit(250);
  if (error) throw error;
  return (data ?? []) as NewsletterCampaign[];
}

export async function saveNewsletterDraft(draft: CampaignDraft, campaignId?: string) {
  const supabase = getSupabaseClient();
  if (campaignId) {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .update({ ...draft, status: 'draft' })
      .eq('id', campaignId)
      .in('status', ['draft', 'failed'])
      .select('id,subject,title,body,type,status,recipient_count,created_by,created_at,updated_at,sent_at,send_error')
      .single();
    if (error) throw error;
    return data as NewsletterCampaign;
  }

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert({ ...draft, status: 'draft' })
    .select('id,subject,title,body,type,status,recipient_count,created_by,created_at,updated_at,sent_at,send_error')
    .single();
  if (error) throw error;
  return data as NewsletterCampaign;
}

export async function sendNewsletterCampaign(campaignId: string) {
  const { data, error } = await getSupabaseClient().functions.invoke('send-newsletter', {
    body: { campaignId, confirm: true },
  });
  if (error) throw new Error(await functionErrorMessage(error, 'The newsletter could not be sent.'));
  if (data?.error) throw new Error(data.error);
  return data as { ok: boolean; sent: number; failed: number; message: string };
}

