import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";

export interface FriendRow {
  id: string;
  owner_email: string;
  friend_email: string;
  friend_name: string;
}

function client() {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error("Supabase non configuré");
  return createClient(cfg.url, cfg.key);
}

export async function listFriends(ownerEmail: string): Promise<FriendRow[]> {
  const sb = client();
  const email = ownerEmail.trim().toLowerCase();
  const { data, error } = await sb
    .from("tempo_friends")
    .select("*")
    .eq("owner_email", email)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.message.includes("tempo_friends")) {
      throw new Error("Table amis absente — exécutez supabase/FRIENDS-AND-LOBBY.sql");
    }
    throw new Error(error.message);
  }
  return (data || []) as FriendRow[];
}

export async function addFriend(ownerEmail: string, friendEmail: string, friendName: string) {
  const sb = client();
  const owner = ownerEmail.trim().toLowerCase();
  const friend = friendEmail.trim().toLowerCase();
  if (!friend.includes("@")) throw new Error("Email ami invalide");
  if (friend === owner) throw new Error("Vous ne pouvez pas vous ajouter vous-même");

  const { error } = await sb.from("tempo_friends").insert({
    owner_email: owner,
    friend_email: friend,
    friend_name: friendName.trim() || friend.split("@")[0],
  });
  if (error) {
    if (error.message.includes("duplicate")) throw new Error("Cet ami est déjà dans votre liste");
    throw error;
  }
}

export async function removeFriend(id: string) {
  const sb = client();
  const { error } = await sb.from("tempo_friends").delete().eq("id", id);
  if (error) throw new Error(error.message);
}