import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

/*
 * The Supabase client for /admin only.
 *
 * It is separate from lib/supabase.ts on purpose. The site's client keeps a
 * session in localStorage so a member can come back to onboarding or the
 * deletion page; a staff session should not outlive the tab. This client
 * stores its session in sessionStorage (survives a reload, gone when the tab
 * closes) under its own storage key, so the two never read each other's
 * tokens and supabase-js does not warn about two clients sharing one key.
 *
 * Same project, same anon key, same URL. There is no service-role key on the
 * website and never will be: the numbers come from RPCs that check the
 * caller's role server-side (ume_require_admin), so the browser holds nothing
 * a member could not already hold.
 *
 * Browser-only. Call it inside effects and handlers, never at module scope,
 * because Next renders client components on the server once and there is no
 * window there.
 */

let client: SupabaseClient | null = null;

export function adminSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  if (typeof window === "undefined") {
    throw new Error("adminSupabase() is browser-only.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  client = createClient(url, key, {
    auth: {
      storage: window.sessionStorage,
      storageKey: "umelike-admin-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
