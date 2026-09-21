import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeaders,
  jsonResponse,
  newsletterHtml,
  sha256Hex,
  siteUrl,
} from "../_shared/newsletter.ts";

const RESEND_BATCH_SIZE = 100;
const MAX_RECIPIENTS = 10_000;
const PAGE_SIZE = 1_000;
const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

type Campaign = {
  id: string;
  subject: string;
  title: string;
  body: string;
  status: "draft" | "sending" | "sent" | "failed";
};

type Recipient = { id: string; email: string };
type Delivery = {
  subscriber_id: string;
  status: "pending" | "sent" | "failed";
  subscriber: Recipient & { status: "subscribed" | "unsubscribed" };
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function pagedRecipients(admin: ReturnType<typeof createClient>): Promise<Recipient[]> {
  const recipients: Recipient[] = [];
  for (let page = 0; page <= MAX_RECIPIENTS / PAGE_SIZE; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("id,email")
      .eq("status", "subscribed")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as Recipient[];
    recipients.push(...rows);
    if (rows.length < PAGE_SIZE) return recipients;
    if (recipients.length >= MAX_RECIPIENTS) {
      throw new Error(`Recipient safety limit of ${MAX_RECIPIENTS} exceeded`);
    }
  }
  return recipients;
}

async function pagedDeliveries(
  admin: ReturnType<typeof createClient>,
  campaignId: string,
): Promise<Delivery[]> {
  const deliveries: Delivery[] = [];
  for (let page = 0; page <= MAX_RECIPIENTS / PAGE_SIZE; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await admin
      .from("newsletter_deliveries")
      .select("subscriber_id,status,subscriber:newsletter_subscribers!inner(id,email,status)")
      .eq("campaign_id", campaignId)
      .order("subscriber_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Delivery[];
    deliveries.push(...rows);
    if (rows.length < PAGE_SIZE) return deliveries;
    if (deliveries.length >= MAX_RECIPIENTS) {
      throw new Error(`Recipient safety limit of ${MAX_RECIPIENTS} exceeded`);
    }
  }
  return deliveries;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed." }, 405);

  let campaignId: string | undefined;
  let admin: ReturnType<typeof createClient> | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !fromEmail) {
      throw new Error("Newsletter server configuration is incomplete");
    }

    const authorization = req.headers.get("authorization") ?? "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return jsonResponse(req, { error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.slice(7);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user || userData.user.role !== "authenticated") {
      return jsonResponse(req, { error: "Admin authentication required." }, 403);
    }

    // This project's established admin convention is authenticated-only RLS.
    // This query also proves the caller has the corresponding admin access.
    const body = await req.json().catch(() => null);
    campaignId = body?.campaignId;
    if (!isUuid(campaignId) || body?.confirm !== true) {
      return jsonResponse(req, { error: "A valid campaign and explicit confirmation are required." }, 400);
    }
    const { data: authorizedCampaign, error: authorizationError } = await userClient
      .from("newsletter_campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();
    if (authorizationError || !authorizedCampaign) {
      return jsonResponse(req, { error: "Admin access denied." }, 403);
    }

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claimed, error: claimError } = await admin.rpc("claim_newsletter_campaign", {
      p_campaign_id: campaignId,
    });
    if (claimError) throw claimError;
    const campaign = (claimed as unknown as Campaign[] | null)?.[0];
    if (!campaign) {
      const { data: existing } = await admin
        .from("newsletter_campaigns")
        .select("status")
        .eq("id", campaignId)
        .maybeSingle();
      const message = existing?.status === "sent"
        ? "This campaign has already been sent."
        : existing?.status === "sending"
          ? "This campaign is already being sent."
          : "Campaign not found or cannot be sent.";
      return jsonResponse(req, { error: message }, 409);
    }

    let deliveries = await pagedDeliveries(admin, campaign.id);
    if (deliveries.length === 0) {
      const recipients = await pagedRecipients(admin);
      if (recipients.length === 0) {
        await admin.from("newsletter_campaigns").update({
          status: "sent",
          recipient_count: 0,
          sent_at: new Date().toISOString(),
          send_error: null,
        }).eq("id", campaign.id);
        return jsonResponse(req, { ok: true, sent: 0, failed: 0, message: "Campaign completed; there were no active subscribers." });
      }

      const { error: deliveryInsertError } = await admin
        .from("newsletter_deliveries")
        .upsert(
          recipients.map((subscriber) => ({
            campaign_id: campaign.id,
            subscriber_id: subscriber.id,
            status: "pending",
          })),
          { onConflict: "campaign_id,subscriber_id", ignoreDuplicates: true },
        );
      if (deliveryInsertError) throw deliveryInsertError;
      deliveries = recipients.map((subscriber) => ({
        subscriber_id: subscriber.id,
        status: "pending",
        subscriber: { ...subscriber, status: "subscribed" as const },
      }));
    }

    const sentBefore = deliveries.filter((delivery) => delivery.status === "sent").length;
    const recipients = deliveries
      .filter((delivery) => delivery.status !== "sent" && delivery.subscriber.status === "subscribed")
      .map((delivery) => ({ id: delivery.subscriber_id, email: delivery.subscriber.email }));

    let sentThisRun = 0;
    let failedThisRun = 0;
    const batchErrors: string[] = [];

    for (let offset = 0; offset < recipients.length; offset += RESEND_BATCH_SIZE) {
      const batch = recipients.slice(offset, offset + RESEND_BATCH_SIZE);
      const tokenData = await Promise.all(batch.map(async (recipient) => {
        // A secret-keyed, campaign-specific token makes a retried batch's
        // payload deterministic while remaining infeasible to guess.
        const rawToken = await sha256Hex(`unsubscribe:${campaign.id}:${recipient.id}:${serviceRoleKey}`);
        return {
          recipient,
          rawToken,
          tokenHash: await sha256Hex(rawToken),
        };
      }));

      const { error: tokenError } = await admin.rpc("set_newsletter_unsubscribe_tokens", {
        p_tokens: tokenData.map(({ recipient, tokenHash }) => ({
          subscriber_id: recipient.id,
          token_hash: tokenHash,
        })),
      });
      if (tokenError) throw tokenError;

      const messages = tokenData.map(({ recipient, rawToken }) => {
        const unsubscribeUrl = `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(rawToken)}`;
        return {
          from: fromEmail,
          to: [recipient.email],
          subject: campaign.subject,
          html: newsletterHtml({ title: campaign.title, body: campaign.body, unsubscribeUrl }),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
          },
        };
      });

      const resendResponse = await fetch(RESEND_BATCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `newsletter-${campaign.id}-${(await sha256Hex(batch.map((recipient) => recipient.id).join(","))).slice(0, 32)}`,
        },
        body: JSON.stringify(messages),
      });
      const resendResult = await resendResponse.json().catch(() => ({}));

      if (!resendResponse.ok) {
        failedThisRun += batch.length;
        const safeError = `Resend batch failed with HTTP ${resendResponse.status}`;
        batchErrors.push(safeError);
        await admin.from("newsletter_deliveries").upsert(
          batch.map((recipient) => ({
            campaign_id: campaign.id,
            subscriber_id: recipient.id,
            status: "failed",
            error_message: safeError,
          })),
          { onConflict: "campaign_id,subscriber_id" },
        );
      } else {
        const ids = Array.isArray(resendResult?.data)
          ? resendResult.data
          : Array.isArray(resendResult)
            ? resendResult
            : [];
        const now = new Date().toISOString();
        const { error: deliveryUpdateError } = await admin.from("newsletter_deliveries").upsert(
          batch.map((recipient, index) => ({
            campaign_id: campaign.id,
            subscriber_id: recipient.id,
            status: "sent",
            provider_message_id: ids[index]?.id ?? null,
            error_message: null,
            sent_at: now,
          })),
          { onConflict: "campaign_id,subscriber_id" },
        );
        if (deliveryUpdateError) throw deliveryUpdateError;
        sentThisRun += batch.length;
      }

      // Resend's documented default limit is two requests per second.
      if (offset + RESEND_BATCH_SIZE < recipients.length) await delay(600);
    }

    const successfulTotal = sentBefore + sentThisRun;
    const campaignStatus = failedThisRun > 0 ? "failed" : "sent";
    const { error: finalUpdateError } = await admin.from("newsletter_campaigns").update({
      status: campaignStatus,
      recipient_count: successfulTotal,
      sent_at: campaignStatus === "sent" ? new Date().toISOString() : null,
      send_error: batchErrors.length > 0
        ? `${failedThisRun} delivery attempt(s) failed. Successful deliveries will not be repeated on retry.`
        : null,
    }).eq("id", campaign.id);
    if (finalUpdateError) throw finalUpdateError;

    return jsonResponse(req, {
      ok: campaignStatus === "sent",
      sent: successfulTotal,
      failed: failedThisRun,
      message: campaignStatus === "sent"
        ? `Newsletter sent to ${successfulTotal} subscriber${successfulTotal === 1 ? "" : "s"}.`
        : `Sent ${successfulTotal}; ${failedThisRun} failed. You can retry the failed deliveries safely.`,
    }, campaignStatus === "sent" ? 200 : 207);
  } catch (error) {
    console.error("send-newsletter failed", error);
    if (admin && campaignId) {
      await admin.from("newsletter_campaigns").update({
        status: "failed",
        send_error: "The send stopped unexpectedly. A retry will skip completed deliveries.",
      }).eq("id", campaignId).eq("status", "sending");
    }
    const isLimit = error instanceof Error && error.message.includes("Recipient safety limit");
    return jsonResponse(req, {
      error: isLimit
        ? "This campaign is larger than the current safe send limit. Please contact support before sending."
        : "The newsletter could not be sent. Completed deliveries are preserved and won't be duplicated on retry.",
    }, isLimit ? 413 : 500);
  }
});
