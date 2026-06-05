import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";

export interface OnlineRoomRow {
  code: string;
  game: string;
  host_id: string;
  players: { id: string; name: string }[];
  updated_at: string;
}

export async function fetchActiveOnlineRooms(): Promise<OnlineRoomRow[]> {
  const cfg = getSupabaseConfig();
  if (!cfg) return [];
  const sb = createClient(cfg.url, cfg.key);
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("tempo_rooms")
    .select("code, game, host_id, players, updated_at")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return (data || []) as OnlineRoomRow[];
}