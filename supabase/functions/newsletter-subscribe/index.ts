import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse, normalizeEmail, sha256Hex } from "../_shared/newsletter.ts";

const MAX_ATTEMPTS_PER_HOUR = 8;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Server configuration is incomplete");

    const body = await req.json().catch(() => null);
    const email = normalizeEmail(body?.email);
    if (!email) {
      return jsonResponse(req, { error: "Please enter a valid email address." }, 400);
    }

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const networkId = forwardedFor || req.headers.get("cf-connecting-ip") || "unknown";
    const ipHash = await sha256Hex(`bashcutz-newsletter:${networkId}`);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("newsletter_subscription_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
      return jsonResponse(req, { error: "Too many attempts. Please try again later." }, 429);
    }

    // Keep abuse-control records bounded without retaining long-lived network data.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin.from("newsletter_subscription_attempts").delete().lt("created_at", oneDayAgo);

    const { error: attemptError } = await admin
      .from("newsletter_subscription_attempts")
      .insert({ ip_hash: ipHash });
    if (attemptError) throw attemptError;

    const { data, error } = await admin.rpc("subscribe_to_newsletter", { p_email: email });
    if (error) throw error;
    const result = data?.[0]?.result as string | undefined;

    if (result === "already_subscribed") {
      return jsonResponse(req, {
        ok: true,
        state: result,
        message: "You're already subscribed to BashCutz updates.",
      });
    }

    return jsonResponse(req, {
      ok: true,
      state: result ?? "subscribed",
      message: result === "resubscribed"
        ? "Welcome back! You're subscribed to BashCutz updates again."
        : "You're in! Watch your inbox for BashCutz updates.",
    });
  } catch (error) {
    console.error("newsletter-subscribe failed", error);
    return jsonResponse(req, { error: "We couldn't subscribe you right now. Please try again." }, 500);
  }
});
