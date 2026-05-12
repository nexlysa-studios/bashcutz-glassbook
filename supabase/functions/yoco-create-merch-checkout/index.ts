// Edge Function: yoco-create-merch-checkout
// Creates a Yoco Online Checkout for a merch order and returns the redirect URL.
//
// Required env vars:
//   YOCO_SECRET_KEY
//   SUPABASE_URL              (auto)
//   SUPABASE_SERVICE_ROLE_KEY (auto)
//   PUBLIC_SITE_URL
//
// Deploy:
//   supabase functions deploy yoco-create-merch-checkout --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const YOCO_API = "https://payments.yoco.com/api/checkouts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const YOCO_SECRET_KEY = Deno.env.get("YOCO_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PUBLIC_SITE_URL =
      Deno.env.get("PUBLIC_SITE_URL") ?? req.headers.get("origin") ?? "";

    if (!YOCO_SECRET_KEY) throw new Error("YOCO_SECRET_KEY not configured");
    if (!SUPABASE_URL || !SERVICE_ROLE)
      throw new Error("Supabase env not configured");

    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body?.orderId;
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: order, error: fetchErr } = await admin
      .from("merch_orders")
      .select(
        "id, product_id, product_name, size, quantity, unit_price_cents, customer_name, customer_phone, customer_address, payment_status",
      )
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountCents = Math.round(
      Number(order.unit_price_cents) * Number(order.quantity || 1),
    );
    if (!amountCents || amountCents < 200) {
      return new Response(JSON.stringify({ error: "Invalid order amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = PUBLIC_SITE_URL.replace(/\/$/, "");
    const successUrl = `${origin}/merch/success?orderId=${order.id}`;
    const cancelUrl = `${origin}/merch/success?orderId=${order.id}&status=cancelled`;
    const failureUrl = `${origin}/merch/success?orderId=${order.id}&status=failed`;

    const yocoRes = await fetch(YOCO_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: "ZAR",
        successUrl,
        cancelUrl,
        failureUrl,
        metadata: {
          orderId: order.id,
          orderType: "merch",
          productId: order.product_id,
          productName: order.product_name,
          size: order.size,
          quantity: String(order.quantity),
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
        },
      }),
    });

    const yocoData = await yocoRes.json();
    if (!yocoRes.ok) {
      console.error("Yoco merch checkout error", yocoRes.status, yocoData);
      return new Response(
        JSON.stringify({ error: "Yoco checkout failed", details: yocoData }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await admin
      .from("merch_orders")
      .update({
        payment_status: "pending",
        payment_reference: yocoData.id,
        payment_amount_cents: amountCents,
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ redirectUrl: yocoData.redirectUrl, checkoutId: yocoData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("yoco-create-merch-checkout error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
