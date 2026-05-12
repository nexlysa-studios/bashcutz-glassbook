// Edge Function: yoco-verify-payment
// Fallback verifier called by the success page. Looks up the checkout
// directly against the Yoco API and updates the booking row accordingly.
// This makes the flow resilient to webhook delays or signature failures.
//
// Required env vars:
//   YOCO_SECRET_KEY            - your Yoco secret key
//   SUPABASE_URL               - auto-injected
//   SUPABASE_SERVICE_ROLE_KEY  - auto-injected
//
// Deploy:
//   supabase functions deploy yoco-verify-payment --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const YOCO_SECRET_KEY = Deno.env.get("YOCO_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!YOCO_SECRET_KEY) throw new Error("YOCO_SECRET_KEY not configured");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env not configured");

    const body = await req.json().catch(() => ({}));
    const bookingId: string | undefined = body?.bookingId;
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, payment_status, payment_reference")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already finalised — nothing to do
    if (booking.payment_status === "paid" || booking.payment_status === "failed" || booking.payment_status === "cancelled") {
      return new Response(JSON.stringify({ payment_status: booking.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!booking.payment_reference) {
      return new Response(JSON.stringify({ payment_status: booking.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up checkout from Yoco
    const yocoRes = await fetch(
      `https://payments.yoco.com/api/checkouts/${booking.payment_reference}`,
      {
        headers: { Authorization: `Bearer ${YOCO_SECRET_KEY}` },
      },
    );
    const yocoData = await yocoRes.json().catch(() => ({}));
    if (!yocoRes.ok) {
      console.error("Yoco lookup failed", yocoRes.status, yocoData);
      return new Response(
        JSON.stringify({ payment_status: booking.payment_status, yocoError: yocoData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Yoco checkout status values: "created" | "active" | "completed" | "expired" | "cancelled" | "failed"
    const yocoStatus: string = yocoData?.status ?? "";
    let newStatus: "paid" | "failed" | "cancelled" | "pending" = "pending";
    if (yocoStatus === "completed" || yocoStatus === "successful") newStatus = "paid";
    else if (yocoStatus === "failed") newStatus = "failed";
    else if (yocoStatus === "cancelled" || yocoStatus === "expired") newStatus = "cancelled";

    if (newStatus !== "pending" && newStatus !== booking.payment_status) {
      const update: Record<string, unknown> = { payment_status: newStatus };
      if (newStatus === "paid") update.paid_at = new Date().toISOString();
      const { error: upErr } = await admin
        .from("bookings")
        .update(update)
        .eq("id", booking.id);
      if (upErr) console.error("Update failed", upErr);
    }

    return new Response(
      JSON.stringify({ payment_status: newStatus, yocoStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("yoco-verify-payment error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
