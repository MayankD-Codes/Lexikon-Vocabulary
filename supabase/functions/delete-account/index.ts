// Deletes the authenticated user and all associated data.
// Called from the Profile page "Delete account" flow.
// Auth: requires a valid bearer JWT. Uses service role to delete the auth user.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Please sign in." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: claims, error: claimsErr } = await anon.auth.getClaims(authHeader.slice(7));
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Session expired. Please sign in again." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.claims.sub as string;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Best-effort delete of user-owned rows. Most tables have ON DELETE CASCADE
  // from auth.users, but we delete explicitly to keep this resilient.
  const tables = [
    "memory_palace_placements",
    "memory_palace_anchors",
    "quiz_sessions",
    "word_stats",
    "words",
    "community_messages",
    "payment_verification_requests",
    "user_subscriptions",
    "profiles",
  ];
  for (const t of tables) {
    const { error } = await admin.from(t).delete().eq("user_id", userId);
    if (error && !/no rows|not found/i.test(error.message)) {
      console.error(`delete-account: failed to clear ${t}:`, error.message);
    }
  }

  // Delete avatar files
  try {
    const { data: files } = await admin.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await admin.storage
        .from("avatars")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }
  } catch (e) {
    console.error("delete-account: storage cleanup:", (e as Error).message);
  }

  // Finally delete the auth user
  const { error: authDeleteErr } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteErr) {
    console.error("delete-account: auth.admin.deleteUser:", authDeleteErr.message);
    return new Response(
      JSON.stringify({ error: "Couldn't delete your account. Please contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
