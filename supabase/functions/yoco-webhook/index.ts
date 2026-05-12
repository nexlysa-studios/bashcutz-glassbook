// Edge Function: yoco-webhook
// Receives Yoco webhook events and marks bookings as paid / failed.
//
// Required env vars:
//   YOCO_WEBHOOK_SECRET  - the `secret` Yoco returned when you registered the webhook
//   SUPABASE_URL         - auto-injected
//   SUPABASE_SERVICE_ROLE_KEY - auto-injected
//
// Yoco uses Svix-style signing. Headers sent on each delivery:
//   webhook-id, webhook-timestamp, webhook-signature
// Signed payload string: `${id}.${timestamp}.${rawBody}`
// HMAC-SHA256 with the secret (base64-decoded), result base64.
// `webhook-signature` is space-separated list of `v1,<sig>` entries — match any.
//
// Deploy:
//   supabase functions deploy yoco-webhook --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, webhook-id, webhook-timestamp, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function verifySignature(
  secret: string,
  webhookId: string,
  webhookTimestamp: string,
  rawBody: string,
  webhookSignature: string,
): Promise<boolean> {
  // Strip the optional "whsec_" prefix Yoco returns when you register a webhook
  const rawSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const keyBytes = base64ToBytes(rawSecret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = bytesToBase64(new Uint8Array(sig));
  // header is space-separated: "v1,<sig> v1,<sig2>"
  const provided = webhookSignature.split(" ").map((part) => part.split(",")[1]).filter(Boolean);
  return provided.some((s) => s === expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SECRET = Deno.env.get("YOCO_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SECRET) throw new Error("YOCO_WEBHOOK_SECRET not configured");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env not configured");

    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return new Response("Missing webhook headers", { status: 400, headers: corsHeaders });
    }

    // Reject events older than 5 minutes (replay protection)
    const tsSeconds = Number(webhookTimestamp);
    if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
      return new Response("Stale webhook", { status: 400, headers: corsHeaders });
    }

    const rawBody = await req.text();
    const valid = await verifySignature(
      SECRET,
      webhookId,
      webhookTimestamp,
      rawBody,
      webhookSignature,
    );
    if (!valid) {
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    const type: string = event?.type ?? "";
    const payload = event?.payload ?? {};
    const metadata = payload?.metadata ?? {};
    const bookingId: string | undefined = metadata?.bookingId;
    const orderId: string | undefined = metadata?.orderId;
    const orderType: string | undefined = metadata?.orderType;
    const checkoutId: string | undefined =
      payload?.metadata?.checkoutId ?? payload?.checkoutId ?? payload?.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let newStatus: "paid" | "failed" | "cancelled" | null = null;
    if (type === "payment.succeeded") newStatus = "paid";
    else if (type === "payment.failed") newStatus = "failed";
    else if (type === "payment.cancelled" || type === "checkout.cancelled") newStatus = "cancelled";

    if (newStatus) {
      const update: Record<string, unknown> = { payment_status: newStatus };
      if (newStatus === "paid") update.paid_at = new Date().toISOString();

      // Determine which table to update
      const isMerch = orderType === "merch" || !!orderId;
      const table = isMerch ? "merch_orders" : "bookings";
      const refId = isMerch ? orderId : bookingId;

      let query = admin.from(table).update(update);
      if (refId) {
        query = query.eq("id", refId);
      } else if (checkoutId) {
        // Fall back to checkout reference. Try bookings first, then merch_orders.
        const { data: bk } = await admin
          .from("bookings")
          .select("id")
          .eq("payment_reference", checkoutId)
          .maybeSingle();
        if (bk) {
          query = admin.from("bookings").update(update).eq("payment_reference", checkoutId);
        } else {
          query = admin.from("merch_orders").update(update).eq("payment_reference", checkoutId);
        }
      } else {
        return new Response("No reference on event", { status: 200, headers: corsHeaders });
      }
      const { error } = await query;
      if (error) {
        console.error("Failed to update row", error);
        return new Response("DB update failed", { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("yoco-webhook error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
