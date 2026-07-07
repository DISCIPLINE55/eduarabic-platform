import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// The manage-users function source code (bundled inline)
const MANAGE_USERS_SOURCE = `import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
  if (authError || !caller) return json({ error: "Unauthorized" }, 401);
  const { data: callerProfile } = await adminClient.from("profiles").select("role, organization_id").eq("id", caller.id).maybeSingle();
  if (!callerProfile) return json({ error: "Profile not found" }, 403);
  const role = callerProfile.role;
  const orgId = callerProfile.organization_id;
  const method = req.method;
  if (method === "GET") {
    let query = adminClient.from("profiles").select("id, full_name, email, role, organization_id, created_at, avatar_url, is_profile_complete, institutions(name)");
    if (role === "super_admin") {} else if (role === "admin" && orgId) { query = query.eq("organization_id", orgId); } else { return json({ error: "Forbidden" }, 403); }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ users: data ?? [] });
  }
  if (method === "POST") {
    let body; try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }
    const { email, password, full_name, newRole, organization_id } = body;
    if (!email || !password || !newRole) return json({ error: "email, password, and newRole are required" }, 400);
    if (role === "super_admin") {} else if (role === "admin") { const allowed = ["teacher","student","parent","secretary"]; if (!allowed.includes(newRole)) return json({ error: "Forbidden" }, 403); } else { return json({ error: "Forbidden" }, 403); }
    const targetOrgId = role === "super_admin" ? (organization_id || null) : orgId;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
    if (createError) return json({ error: createError.message }, 400);
    if (!newUser?.user) return json({ error: "User creation failed" }, 500);
    const { error: profileError } = await adminClient.from("profiles").upsert({ id: newUser.user.id, email, full_name: full_name || null, role: newRole, organization_id: targetOrgId, is_profile_complete: true });
    if (profileError) return json({ error: profileError.message }, 500);
    return json({ user: { id: newUser.user.id, email, role: newRole } });
  }
  if (method === "PATCH") {
    let body; try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }
    const { userId, newRole, newOrgId } = body;
    if (!userId || !newRole) return json({ error: "userId and newRole are required" }, 400);
    const { data: targetProfile } = await adminClient.from("profiles").select("role, organization_id").eq("id", userId).maybeSingle();
    if (!targetProfile) return json({ error: "Target user not found" }, 404);
    if (targetProfile.role === "super_admin") return json({ error: "Super admin accounts cannot be modified" }, 403);
    if (newRole === "super_admin") return json({ error: "Cannot assign super_admin role via this endpoint" }, 403);
    if (role === "super_admin") {} else if (role === "admin") { const allowed = ["teacher","student","parent","secretary"]; if (!allowed.includes(newRole)) return json({ error: "Forbidden" }, 403); if (targetProfile.organization_id !== orgId) return json({ error: "Forbidden: different organization" }, 403); } else { return json({ error: "Forbidden" }, 403); }
    const updates = { role: newRole };
    if (newOrgId !== undefined) updates.organization_id = newOrgId || null;
    const { error: updateError } = await adminClient.from("profiles").update(updates).eq("id", userId);
    if (updateError) return json({ error: updateError.message }, 500);
    return json({ success: true });
  }
  return json({ error: "Method not allowed" }, 405);
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}`;

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

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "super_admin") return json({ error: "Forbidden" }, 403);

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }

  const { pat, projectRef } = body;
  if (!pat || !projectRef) return json({ error: "pat and projectRef are required" }, 400);

  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Starting deployment of manage-users function...`);

  // Try to create function first, then update if it exists
  const functionBody = {
    slug: "manage-users",
    name: "manage-users",
    body: MANAGE_USERS_SOURCE,
    verify_jwt: true,
  };

  // Attempt create
  logs.push(`[${new Date().toISOString()}] Calling Supabase Management API...`);
  const createRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(functionBody),
  });

  let deployed = false;
  let apiError = "";

  if (createRes.ok) {
    deployed = true;
    logs.push(`[${new Date().toISOString()}] Function created successfully.`);
  } else {
    const errText = await createRes.text();
    logs.push(`[${new Date().toISOString()}] Create attempt: ${createRes.status} - ${errText}`);

    // If already exists (409), try PATCH to update
    if (createRes.status === 409 || errText.includes("already exists")) {
      logs.push(`[${new Date().toISOString()}] Function exists, updating...`);
      const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/manage-users`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${pat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: MANAGE_USERS_SOURCE, verify_jwt: true }),
      });

      if (patchRes.ok) {
        deployed = true;
        logs.push(`[${new Date().toISOString()}] Function updated successfully.`);
      } else {
        const patchErr = await patchRes.text();
        apiError = patchErr;
        logs.push(`[${new Date().toISOString()}] Update failed: ${patchRes.status} - ${patchErr}`);
      }
    } else {
      apiError = errText;
    }
  }

  if (deployed) {
    logs.push(`[${new Date().toISOString()}] Deployment complete. manage-users is now live.`);
    return json({ success: true, logs });
  }

  logs.push(`[${new Date().toISOString()}] Deployment failed.`);
  return json({ success: false, error: apiError, logs }, 500);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
