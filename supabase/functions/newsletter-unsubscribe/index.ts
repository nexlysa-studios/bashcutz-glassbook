import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse, sha256Hex } from "../_shared/newsletter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Server configuration is incomplete");

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim().toLowerCase() : "";
    if (!/^[0-9a-f]{64}$/.test(token)) {
      return jsonResponse(req, { error: "This unsubscribe link is invalid or has expired." }, 400);
    }

    const tokenHash = await sha256Hex(token);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", tokenHash)
      .select("status")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return jsonResponse(req, { error: "This unsubscribe link is invalid or has expired." }, 404);
    }

    return jsonResponse(req, {
      ok: true,
      message: "You've successfully unsubscribed from BashCutz updates.",
    });
  } catch (error) {
    console.error("newsletter-unsubscribe failed", error);
    return jsonResponse(req, { error: "We couldn't update your preference right now. Please try again." }, 500);
  }
});
