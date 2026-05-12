// Edge Function: yoco-verify-merch-payment
// Fallback verifier for merch orders. Reconciles directly against Yoco.
//
// Deploy:
//   supabase functions deploy yoco-verify-merch-payment --no-verify-jwt

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
    const orderId: string | undefined = body?.orderId;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: order, error: fetchErr } = await admin
      .from("merch_orders")
      .select("id, payment_status, payment_reference")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      order.payment_status === "paid" ||
      order.payment_status === "failed" ||
      order.payment_status === "cancelled"
    ) {
      return new Response(JSON.stringify({ payment_status: order.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.payment_reference) {
      return new Response(JSON.stringify({ payment_status: order.payment_status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yocoRes = await fetch(
      `https://payments.yoco.com/api/checkouts/${order.payment_reference}`,
      { headers: { Authorization: `Bearer ${YOCO_SECRET_KEY}` } },
    );
    const yocoData = await yocoRes.json().catch(() => ({}));
    if (!yocoRes.ok) {
      console.error("Yoco merch lookup failed", yocoRes.status, yocoData);
      return new Response(
        JSON.stringify({ payment_status: order.payment_status, yocoError: yocoData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const yocoStatus: string = yocoData?.status ?? "";
    let newStatus: "paid" | "failed" | "cancelled" | "pending" = "pending";
    if (yocoStatus === "completed" || yocoStatus === "successful") newStatus = "paid";
    else if (yocoStatus === "failed") newStatus = "failed";
    else if (yocoStatus === "cancelled" || yocoStatus === "expired") newStatus = "cancelled";

    if (newStatus !== "pending" && newStatus !== order.payment_status) {
      const update: Record<string, unknown> = { payment_status: newStatus };
      if (newStatus === "paid") update.paid_at = new Date().toISOString();
      const { error: upErr } = await admin
        .from("merch_orders")
        .update(update)
        .eq("id", order.id);
      if (upErr) console.error("Update failed", upErr);
    }

    return new Response(
      JSON.stringify({ payment_status: newStatus, yocoStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("yoco-verify-merch-payment error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
