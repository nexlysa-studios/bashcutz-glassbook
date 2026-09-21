export const jsonHeaders = { "Content-Type": "application/json" };

const DEFAULT_SITE_URL = "https://bashcutz.co.za";

export function siteUrl(): string {
  return (
    Deno.env.get("NEWSLETTER_SITE_URL") ??
    Deno.env.get("PUBLIC_SITE_URL") ??
    DEFAULT_SITE_URL
  ).replace(/\/$/, "");
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const configuredOrigin = siteUrl();
  const allowed = new Set([
    DEFAULT_SITE_URL,
    configuredOrigin,
    "https://www.bashcutz.co.za",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]);

  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : configuredOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), ...jsonHeaders },
  });
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  // Deliberately pragmatic validation; Resend remains the final mailbox syntax validator.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return null;
  return email;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function newsletterHtml(input: {
  title: string;
  body: string;
  unsubscribeUrl: string;
}): string {
  const paragraphs = input.body
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) =>
      `<p style="margin:0 0 18px;color:#dedede;font-size:16px;line-height:1.75">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`
    )
    .join("");
  const baseUrl = siteUrl();
  const title = escapeHtml(input.title);
  const unsubscribeUrl = escapeHtml(input.unsubscribeUrl);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#080808;color:#f7f7f7;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${title} — BashCutz updates</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080808">
    <tr><td align="center" style="padding:28px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#111;border:1px solid #2d2d2d;border-radius:22px;overflow:hidden">
        <tr><td align="center" style="padding:28px 24px;background:linear-gradient(135deg,#171717,#0b0b0b);border-bottom:1px solid #2d2d2d">
          <a href="${baseUrl}" style="text-decoration:none;color:#ff9d24;font-size:27px;font-weight:800;letter-spacing:2px">BASHCUTZ</a>
          <div style="margin-top:7px;color:#999;font-size:11px;letter-spacing:3px;text-transform:uppercase">WorldWide</div>
        </td></tr>
        <tr><td style="padding:38px 28px 22px">
          <h1 style="margin:0 0 24px;color:#fff;font-size:30px;line-height:1.2">${title}</h1>
          ${paragraphs}
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:30px 0 12px"><tr><td style="border-radius:12px;background:#f59e0b">
            <a href="${baseUrl}/#services" style="display:inline-block;padding:14px 25px;color:#080808;font-size:15px;font-weight:700;text-decoration:none">Book Now</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:24px 28px;background:#0b0b0b;border-top:1px solid #292929;color:#8d8d8d;font-size:12px;line-height:1.7">
          <strong style="color:#d8d8d8">BashCutz</strong><br>
          <a href="${baseUrl}" style="color:#f59e0b;text-decoration:none">bashcutz.co.za</a>
          <p style="margin:16px 0 0">You are receiving this email because you subscribed to BashCutz updates.</p>
          <a href="${unsubscribeUrl}" style="color:#bdbdbd;text-decoration:underline">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
