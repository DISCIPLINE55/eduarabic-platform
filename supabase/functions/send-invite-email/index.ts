import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  const { data: callerProfile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!callerProfile || callerProfile.role !== "super_admin") {
    return json({ error: "Forbidden: super_admin only" }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }

  const { emails, inviteUrl, role, institutionName, expiresAt } = body as {
    emails: string[];
    inviteUrl: string;
    role: string;
    institutionName: string;
    expiresAt: string;
  };

  if (!emails?.length || !inviteUrl || !role || !institutionName) {
    return json({ error: "emails, inviteUrl, role, and institutionName are required" }, 400);
  }

  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduArabic Invitation</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:6px;overflow:hidden;border:1px solid #E5E7EB;">
        <!-- Header -->
        <tr>
          <td style="background:#8B0000;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">EduArabic</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Islamic Education Management Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:600;">You've been invited!</h2>
            <p style="margin:0 0 24px;color:#4B5563;font-size:15px;line-height:1.6;">
              You have been invited to join <strong style="color:#111827;">${institutionName}</strong> on EduArabic as a <strong style="color:#8B0000;">${roleDisplay}</strong>.
            </p>

            <!-- Details Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:4px;margin:0 0 28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;width:130px;">Institution</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${institutionName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Role</td>
                      <td style="padding:6px 0;color:#8B0000;font-size:13px;font-weight:600;">${roleDisplay}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6B7280;font-size:13px;">Expires On</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${expiry}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#8B0000;border-radius:4px;padding:0;">
                  <a href="${inviteUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">Accept Invitation</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#6B7280;font-size:13px;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 28px;padding:10px 14px;background:#F8F9FA;border:1px solid #E5E7EB;border-radius:4px;font-family:'Courier New',monospace;font-size:12px;color:#374151;word-break:break-all;">${inviteUrl}</p>

            <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6;">
              This invitation link expires on <strong>${expiry}</strong>. If you did not expect this invitation, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #E5E7EB;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">© 2026 EduArabic. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const email of emails) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EduArabic <invites@eduarabic.com>",
        to: [email.trim()],
        subject: `You've been invited to join ${institutionName} on EduArabic`,
        html: htmlBody,
      }),
    });

    if (res.ok) {
      results.push({ email, success: true });
    } else {
      const errBody = await res.text();
      results.push({ email, success: false, error: errBody });
    }
  }

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return json({ sent, failed, results });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
