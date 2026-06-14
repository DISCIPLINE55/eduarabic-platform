import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Authenticate the calling user via anon key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Create caller client (checks RLS)
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  // Service-role client (bypasses RLS for admin ops)
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Identify caller
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
  if (authError || !caller) return json({ error: "Unauthorized" }, 401);

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role, organization_id")
    .eq("id", caller.id)
    .maybeSingle();

  if (!callerProfile) return json({ error: "Profile not found" }, 403);

  const role = callerProfile.role as string;
  const orgId = callerProfile.organization_id as string | null;

  const url = new URL(req.url);
  const method = req.method;

  // ── LIST USERS ──────────────────────────────────────────────────────────────
  if (method === "GET") {
    let query = adminClient.from("profiles").select(
      "id, full_name, email, role, organization_id, created_at, avatar_url, is_profile_complete, institutions(name)"
    );

    if (role === "super_admin") {
      // no filter — can see all
    } else if (role === "admin" && orgId) {
      query = query.eq("organization_id", orgId);
    } else {
      return json({ error: "Forbidden" }, 403);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ users: data ?? [] });
  }

  // ── CREATE USER ─────────────────────────────────────────────────────────────
  if (method === "POST") {
    let body: Record<string, string>;
    try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }

    const { email, password, full_name, newRole, organization_id } = body;
    if (!email || !password || !newRole) return json({ error: "email, password, and newRole are required" }, 400);

    // Permissions check
    if (role === "super_admin") {
      // super_admin can create any role
    } else if (role === "admin") {
      const allowedRoles = ["teacher", "student", "parent", "secretary"];
      if (!allowedRoles.includes(newRole)) return json({ error: "Admins can only create teacher/student/parent/secretary accounts" }, 403);
    } else {
      return json({ error: "Forbidden" }, 403);
    }

    const targetOrgId = role === "super_admin" ? (organization_id || null) : orgId;

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) return json({ error: createError.message }, 400);
    if (!newUser?.user) return json({ error: "User creation failed" }, 500);

    // Upsert profile
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUser.user.id,
      email,
      full_name: full_name || null,
      role: newRole,
      organization_id: targetOrgId,
      is_profile_complete: true,
    });

    if (profileError) return json({ error: profileError.message }, 500);
    return json({ user: { id: newUser.user.id, email, role: newRole } });
  }

  // ── UPDATE USER ROLE ────────────────────────────────────────────────────────
  if (method === "PATCH") {
    let body: Record<string, string>;
    try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }

    const { userId, newRole, newOrgId } = body;
    if (!userId || !newRole) return json({ error: "userId and newRole are required" }, 400);

    // Fetch target user's current profile
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("role, organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (!targetProfile) return json({ error: "Target user not found" }, 404);

    if (role === "super_admin") {
      // super_admin can set any role
    } else if (role === "admin") {
      const allowedRoles = ["teacher", "student", "parent", "secretary"];
      if (!allowedRoles.includes(newRole)) return json({ error: "Admins can only assign teacher/student/parent/secretary roles" }, 403);
      // Must be in same org
      if (targetProfile.organization_id !== orgId) return json({ error: "Forbidden: different organization" }, 403);
    } else {
      return json({ error: "Forbidden" }, 403);
    }

    const updates: Record<string, string | null> = { role: newRole };
    if (newOrgId !== undefined) updates.organization_id = newOrgId || null;

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) return json({ error: updateError.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
