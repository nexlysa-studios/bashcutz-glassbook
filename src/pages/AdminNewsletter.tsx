import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { useSEO } from '@/hooks/useSEO';
import {
  CampaignDraft,
  campaignTypeLabels,
  fetchNewsletterCampaigns,
  fetchNewsletterOverview,
  fetchNewsletterSubscribers,
  NewsletterCampaign,
  NewsletterCampaignType,
  NewsletterSubscriber,
  saveNewsletterDraft,
  sendNewsletterCampaign,
} from '@/lib/newsletter';

type AdminTab = 'compose' | 'history' | 'subscribers';

const emptyDraft: CampaignDraft = { type: 'general', subject: '', title: '', body: '' };

function statusClass(status: string) {
  if (status === 'sent' || status === 'subscribed') return 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300';
  if (status === 'failed' || status === 'unsubscribed') return 'border-red-400/30 bg-red-500/15 text-red-300';
  if (status === 'sending') return 'border-blue-400/30 bg-blue-500/15 text-blue-300';
  return 'border-amber-400/30 bg-amber-500/15 text-amber-300';
}

function formatDate(value: string | null) {
  return value ? format(parseISO(value), 'd MMM yyyy, HH:mm') : '—';
}

export default function AdminNewsletter() {
  useSEO({
    title: 'Newsletter | BASHCUTZ Admin',
    description: 'Manage BashCutz subscribers and newsletter campaigns.',
    path: '/admin/newsletter',
    robots: 'noindex, nofollow',
  });

  const [tab, setTab] = useState<AdminTab>('compose');
  const [overview, setOverview] = useState({ activeSubscribers: 0, unsubscribed: 0, totalCampaigns: 0, campaignsSent: 0 });
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [draft, setDraft] = useState<CampaignDraft>(emptyDraft);
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [campaignStatus, setCampaignStatus] = useState<NewsletterCampaign['status']>('draft');
  const [campaignRecipientCount, setCampaignRecipientCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastPreviewedDraft, setLastPreviewedDraft] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [nextOverview, nextCampaigns] = await Promise.all([
        fetchNewsletterOverview(),
        fetchNewsletterCampaigns(),
      ]);
      setOverview(nextOverview);
      setCampaigns(nextCampaigns);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load newsletter data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      setSubscribers(await fetchNewsletterSubscribers(search, statusFilter));
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load subscribers.' });
    } finally {
      setSubscribersLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'subscribers') void loadSubscribers();
  }, [tab, loadSubscribers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') !== 'price_update') return;
    const service = params.get('service')?.trim() || 'service';
    const oldPrice = params.get('oldPrice')?.trim() || '';
    const newPrice = params.get('newPrice')?.trim() || '';
    setDraft({
      type: 'price_update',
      subject: `Price Update – ${service}`,
      title: 'Service Price Update',
      body: `We'd like to let you know that the price of our ${service} service has been updated.\n\nPrevious price: R${oldPrice}\nNew price: R${newPrice}\n\nThank you for your continued support.`,
    });
  }, []);

  const editable = campaignStatus === 'draft' || (campaignStatus === 'failed' && campaignRecipientCount === 0);
  const draftValid = draft.subject.trim() && draft.title.trim() && draft.body.trim();

  const openCampaign = (campaign: NewsletterCampaign) => {
    setDraft({ type: campaign.type, subject: campaign.subject, title: campaign.title, body: campaign.body });
    setCampaignId(campaign.id);
    setCampaignStatus(campaign.status);
    setCampaignRecipientCount(campaign.recipient_count);
    setLastPreviewedDraft(null);
    setTab('compose');
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const newCampaign = () => {
    setDraft(emptyDraft);
    setCampaignId(undefined);
    setCampaignStatus('draft');
    setCampaignRecipientCount(0);
    setLastPreviewedDraft(null);
    setTab('compose');
    setNotice(null);
  };

  const persistDraft = async () => {
    if (!draftValid) {
      setNotice({ kind: 'error', text: 'Complete the campaign type, subject, heading and message first.' });
      return null;
    }
    setSaving(true);
    try {
      const saved = await saveNewsletterDraft({
        ...draft,
        subject: draft.subject.trim(),
        title: draft.title.trim(),
        body: draft.body.trim(),
      }, campaignId);
      setCampaignId(saved.id);
      setCampaignStatus(saved.status);
      setCampaignRecipientCount(saved.recipient_count);
      setNotice({ kind: 'success', text: 'Campaign saved as a draft.' });
      await loadDashboard();
      return saved;
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save the campaign.' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const requestSend = async () => {
    if (campaignStatus === 'sent' || campaignStatus === 'sending') return;
    if (lastPreviewedDraft !== JSON.stringify(draft)) {
      setNotice({ kind: 'error', text: 'Preview the current version of this email before sending.' });
      return;
    }
    if (campaignStatus === 'failed' && campaignRecipientCount > 0 && campaignId) {
      setConfirmOpen(true);
      return;
    }
    const saved = await persistDraft();
    if (saved) setConfirmOpen(true);
  };

  const confirmSend = async () => {
    if (!campaignId) return;
    setSending(true);
    setConfirmOpen(false);
    try {
      const result = await sendNewsletterCampaign(campaignId);
      setNotice({ kind: result.failed ? 'error' : 'success', text: result.message });
      const nextStatus = result.failed ? 'failed' : 'sent';
      setCampaignStatus(nextStatus);
      setCampaignRecipientCount(result.sent);
      await loadDashboard();
    } catch (error) {
      setCampaignStatus('failed');
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'The newsletter could not be sent.' });
      await loadDashboard();
    } finally {
      setSending(false);
    }
  };

  const statCards = [
    { label: 'Active Subscribers', value: overview.activeSubscribers, icon: Users },
    { label: 'Unsubscribed', value: overview.unsubscribed, icon: UserX },
    { label: 'Total Campaigns', value: overview.totalCampaigns, icon: FileText },
    { label: 'Campaigns Sent', value: overview.campaignsSent, icon: Send },
  ];

  const hasPreviewedCurrentDraft = lastPreviewedDraft === JSON.stringify(draft);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <GlassNavbar />
      <main className="px-4 pb-16 pt-28 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">Customer Updates</p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">Newsletter</h1>
            </div>
            <button onClick={newCampaign} className="glass-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
              <Plus className="h-4 w-4" /> New Campaign
            </button>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass-card p-4 md:p-6">
                <Icon className="mb-4 h-5 w-5 text-orange-400" />
                <p className="text-2xl font-bold text-white md:text-3xl">{loading ? '—' : value}</p>
                <p className="mt-1 text-xs text-white/45 md:text-sm">{label}</p>
              </div>
            ))}
          </div>

          {notice && (
            <div role="status" className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${notice.kind === 'success' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' : 'border-red-400/25 bg-red-500/10 text-red-200'}`}>
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {([['compose', 'Create Newsletter'], ['history', 'Campaign History'], ['subscribers', 'Subscribers']] as const).map(([value, label]) => (
              <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab === value ? 'bg-orange-500 text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'compose' && (
            <div className="glass-card p-5 md:p-8">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{campaignId ? 'Campaign details' : 'Create newsletter'}</h2>
                  {campaignId && <p className="mt-1 text-xs text-white/35">Campaign ID: {campaignId}</p>}
                </div>
                {campaignId && <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass(campaignStatus)}`}>{campaignStatus}</span>}
              </div>

              {!editable && (
                <p className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                  {campaignStatus === 'failed' ? 'Some recipients already received this campaign. Its content is locked; retrying sends only to deliveries that did not succeed.' : 'Sent and in-progress campaigns are read-only to prevent accidental duplicate sends.'}
                </p>
              )}

              <form onSubmit={(event: FormEvent) => { event.preventDefault(); void persistDraft(); }} className="space-y-5">
                <div>
                  <label htmlFor="campaign-type" className="mb-2 block text-sm text-white/60">Campaign Type</label>
                  <select id="campaign-type" value={draft.type} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as NewsletterCampaignType }))} className="glass-input disabled:cursor-not-allowed disabled:opacity-60">
                    {Object.entries(campaignTypeLabels).map(([value, label]) => <option key={value} value={value} className="bg-neutral-900">{label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="campaign-subject" className="mb-2 block text-sm text-white/60">Subject</label>
                  <input id="campaign-subject" maxLength={180} value={draft.subject} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} className="glass-input disabled:cursor-not-allowed disabled:opacity-60" placeholder="Price Update – September" />
                </div>
                <div>
                  <label htmlFor="campaign-title" className="mb-2 block text-sm text-white/60">Title / Heading</label>
                  <input id="campaign-title" maxLength={180} value={draft.title} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="glass-input disabled:cursor-not-allowed disabled:opacity-60" placeholder="An update from BashCutz" />
                </div>
                <div>
                  <label htmlFor="campaign-body" className="mb-2 block text-sm text-white/60">Message / Body</label>
                  <textarea id="campaign-body" maxLength={20000} rows={10} value={draft.body} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} className="glass-input min-h-56 resize-y disabled:cursor-not-allowed disabled:opacity-60" placeholder="Write your customer update…" />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
                  {editable && <button type="submit" disabled={saving || sending} className="glass-button inline-flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Save Draft</button>}
                  <button type="button" disabled={!draftValid} onClick={() => { setLastPreviewedDraft(JSON.stringify(draft)); setPreviewOpen(true); }} className="glass-button inline-flex items-center justify-center gap-2 disabled:opacity-40"><Eye className="h-4 w-4" /> Preview Email</button>
                  {(campaignStatus === 'draft' || campaignStatus === 'failed') && (
                    <button type="button" disabled={saving || sending || !draftValid || !hasPreviewedCurrentDraft} title={!hasPreviewedCurrentDraft ? 'Preview the current email before sending' : undefined} onClick={() => void requestSend()} className="glass-button-primary inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : campaignStatus === 'failed' ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {campaignStatus === 'failed' ? 'Retry Failed Deliveries' : 'Send Newsletter'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {tab === 'history' && (
            <div className="glass-card overflow-hidden">
              <div className="border-b border-white/10 p-5 md:p-6"><h2 className="text-xl font-semibold">Campaign History</h2></div>
              {campaigns.length === 0 ? <p className="p-10 text-center text-white/40">No campaigns yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-white/40"><tr><th className="px-5 py-4">Subject</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Recipients</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Sent</th></tr></thead>
                    <tbody className="divide-y divide-white/10">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} onClick={() => openCampaign(campaign)} className="cursor-pointer text-white/70 transition hover:bg-white/[0.04]">
                          <td className="px-5 py-4 font-medium text-white">{campaign.subject}</td>
                          <td className="px-5 py-4">{campaignTypeLabels[campaign.type]}</td>
                          <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(campaign.status)}`}>{campaign.status}</span></td>
                          <td className="px-5 py-4">{campaign.recipient_count}</td>
                          <td className="px-5 py-4">{formatDate(campaign.created_at)}</td>
                          <td className="px-5 py-4">{formatDate(campaign.sent_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'subscribers' && (
            <div className="glass-card overflow-hidden">
              <div className="border-b border-white/10 p-5 md:p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <h2 className="text-xl font-semibold">Subscribers</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email" className="glass-input py-2.5 pl-10" /></div>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="glass-input py-2.5 sm:w-44"><option value="all" className="bg-neutral-900">All statuses</option><option value="subscribed" className="bg-neutral-900">Subscribed</option><option value="unsubscribed" className="bg-neutral-900">Unsubscribed</option></select>
                  </div>
                </div>
              </div>
              {subscribersLoading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-orange-400" /></div> : subscribers.length === 0 ? <p className="p-10 text-center text-white/40">No matching subscribers.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-white/40"><tr><th className="px-5 py-4">Email</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Subscribed</th><th className="px-5 py-4">Unsubscribed</th></tr></thead><tbody className="divide-y divide-white/10">{subscribers.map((subscriber) => <tr key={subscriber.id} className="text-white/65"><td className="px-5 py-4 font-medium text-white">{subscriber.email}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(subscriber.status)}`}>{subscriber.status}</span></td><td className="px-5 py-4">{formatDate(subscriber.subscribed_at)}</td><td className="px-5 py-4">{formatDate(subscriber.unsubscribed_at)}</td></tr>)}</tbody></table></div>
              )}
              <p className="border-t border-white/10 px-5 py-3 text-xs text-white/30">Showing up to 500 matching subscribers. Security tokens are never displayed.</p>
            </div>
          )}
        </div>
      </main>

      {previewOpen && (
        <div className="glass-overlay fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-neutral-950/95 p-4 backdrop-blur"><div><p className="text-xs text-white/40">Subject</p><h2 id="preview-title" className="font-semibold text-white">{draft.subject}</h2></div><button onClick={() => setPreviewOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close preview"><X className="h-5 w-5" /></button></div>
            <div className="bg-[#080808] p-4 md:p-8"><div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]"><div className="border-b border-white/10 p-7 text-center"><p className="text-2xl font-black tracking-widest text-orange-500">BASHCUTZ</p><p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/45">WorldWide</p></div><div className="p-7"><h3 className="mb-5 text-3xl font-bold text-white">{draft.title}</h3><div className="whitespace-pre-wrap text-base leading-7 text-white/70">{draft.body}</div><span className="mt-7 inline-block rounded-xl bg-amber-500 px-6 py-3 font-bold text-black">Book Now</span></div><div className="border-t border-white/10 bg-black/40 p-6 text-xs leading-6 text-white/40">BashCutz · bashcutz.co.za<br />You are receiving this email because you subscribed to BashCutz updates.<br /><span className="underline">Unsubscribe</span></div></div></div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="glass-overlay fixed inset-0 z-[110] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="send-confirm-title">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-950 p-6 shadow-2xl md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Mail className="h-6 w-6" /></div>
            <h2 id="send-confirm-title" className="text-2xl font-bold">Confirm newsletter send</h2>
            <p className="mt-3 leading-7 text-white/60">You are about to send this newsletter to <strong className="text-white">{overview.activeSubscribers} active subscriber{overview.activeSubscribers === 1 ? '' : 's'}</strong>.</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-wider text-white/35">Subject</p><p className="mt-1 font-medium text-white">{draft.subject}</p></div>
            <p className="mt-4 text-xs leading-5 text-white/40">Sending cannot be undone. Each subscriber receives an individual email with their own unsubscribe link.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={() => setConfirmOpen(false)} className="glass-button">Cancel</button><button onClick={() => void confirmSend()} className="glass-button-primary inline-flex items-center justify-center gap-2 px-6 py-3"><CheckCircle2 className="h-4 w-4" /> Confirm &amp; Send</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
