export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);
  if (!url || !key || url.includes("xxxxxxxx") || key.includes("VOTRE")) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}