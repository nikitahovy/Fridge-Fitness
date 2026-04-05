import { createClient } from "./server";

/**
 * Get authenticated Supabase client + user for API routes.
 * Returns null user if not authenticated.
 */
export async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
