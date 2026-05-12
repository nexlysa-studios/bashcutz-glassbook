// Edge Function: yoco-create-checkout
// Creates a Yoco Online Checkout for a booking and returns the redirect URL.
//
// Required env vars (set with `supabase secrets set ...`):
//   YOCO_SECRET_KEY     - your Yoco secret key (e.g. sk_test_...)
//   SUPABASE_URL        - auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - auto-injected by Supabase
//   PUBLIC_SITE_URL     - your site origin (e.g. https://bashcutz.co.za) used for return URLs
//
// Deploy:
//   supabase functions deploy yoco-create-checkout --no-verify-jwt

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
    const bookingId: string | undefined = body?.bookingId;
    if (!bookingId || typeof bookingId !== "string") {
      return new Response(
        JSON.stringify({ error: "bookingId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, service, date, time, customer_name, customer_phone, payment_method, payment_status, payment_amount_cents")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Booking already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = booking.service as { name: string; price: number };
    const amountCents = Math.round(Number(service.price) * 100);
    if (!amountCents || amountCents < 200) {
      return new Response(
        JSON.stringify({ error: "Invalid booking amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const origin = PUBLIC_SITE_URL.replace(/\/$/, "");
    const successUrl = `${origin}/booking/success?bookingId=${booking.id}`;
    const cancelUrl = `${origin}/booking/success?bookingId=${booking.id}&status=cancelled`;
    const failureUrl = `${origin}/booking/success?bookingId=${booking.id}&status=failed`;

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
          bookingId: booking.id,
          serviceName: service.name,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          bookingDate: booking.date,
          bookingTime: booking.time,
        },
      }),
    });

    const yocoData = await yocoRes.json();
    if (!yocoRes.ok) {
      console.error("Yoco checkout error", yocoRes.status, yocoData);
      return new Response(
        JSON.stringify({ error: "Yoco checkout failed", details: yocoData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin
      .from("bookings")
      .update({
        payment_status: "pending",
        payment_reference: yocoData.id,
        payment_amount_cents: amountCents,
      })
      .eq("id", booking.id);

    return new Response(
      JSON.stringify({ redirectUrl: yocoData.redirectUrl, checkoutId: yocoData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("yoco-create-checkout error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
