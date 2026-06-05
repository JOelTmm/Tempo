import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { RoomGame } from "../vite-env";
import type { RoomState } from "./multiplayer";
import { getSupabaseConfig } from "./supabase-config";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function rowToRoom(row: {
  code: string;
  game: string;
  host_id: string;
  players: { id: string; name: string }[];
  payload: Record<string, unknown>;
  updated_at: string;
}): RoomState {
  return {
    code: row.code,
    game: row.game as RoomGame,
    hostId: row.host_id,
    players: row.players || [],
    payload: row.payload || {},
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export class SupabaseMultiplayerClient {
  private supabase;
  private channel: RealtimeChannel | null = null;
  private roomCode = "";
  private listeners: ((room: RoomState) => void)[] = [];

  constructor() {
    const cfg = getSupabaseConfig();
    if (!cfg) throw new Error("Supabase non configuré");
    this.supabase = createClient(cfg.url, cfg.key);
  }

  onRoomUpdate(fn: (room: RoomState) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(row: Parameters<typeof rowToRoom>[0]) {
    const room = rowToRoom(row);
    this.listeners.forEach((fn) => fn(room));
  }

  private subscribe(code: string) {
    this.channel?.unsubscribe();
    this.channel = this.supabase
      .channel(`tempo-room-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tempo_rooms", filter: `code=eq.${code}` },
        (payload) => {
          const row = (payload.new || payload.old) as Parameters<typeof rowToRoom>[0];
          if (row?.code) this.emit(row);
        }
      )
      .subscribe();
  }

  async createRoom(game: RoomGame, playerName: string, playerId: string): Promise<RoomState> {
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await this.supabase.from("tempo_rooms").select("code").eq("code", code).maybeSingle();
      if (!existing) break;
      code = generateCode();
    }

    const players = [{ id: playerId, name: playerName }];
    const row = {
      code,
      game,
      host_id: playerId,
      players,
      payload: {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.from("tempo_rooms").insert(row);
    if (error) throw new Error(error.message);

    this.roomCode = code;
    this.subscribe(code);
    const room = rowToRoom(row as Parameters<typeof rowToRoom>[0]);
    this.listeners.forEach((fn) => fn(room));
    return room;
  }

  async joinRoom(code: string, playerName: string, playerId: string): Promise<RoomState> {
    const upper = code.trim().toUpperCase();
    const { data, error } = await this.supabase.from("tempo_rooms").select("*").eq("code", upper).single();
    if (error || !data) throw new Error("Salon introuvable — vérifiez le code");

    const players = (data.players as { id: string; name: string }[]) || [];
    if (!players.some((p) => p.id === playerId)) {
      players.push({ id: playerId, name: playerName });
    }

    const { error: upErr } = await this.supabase
      .from("tempo_rooms")
      .update({ players, updated_at: new Date().toISOString() })
      .eq("code", upper);

    if (upErr) throw new Error(upErr.message);

    this.roomCode = upper;
    this.subscribe(upper);
    const room = rowToRoom({ ...data, players } as Parameters<typeof rowToRoom>[0]);
    this.listeners.forEach((fn) => fn(room));
    return room;
  }

  async sync(payload: Record<string, unknown>) {
    if (!this.roomCode) return;
    const { data } = await this.supabase.from("tempo_rooms").select("payload").eq("code", this.roomCode).single();
    const merged = { ...(data?.payload as object), ...payload };
    await this.supabase
      .from("tempo_rooms")
      .update({ payload: merged, updated_at: new Date().toISOString() })
      .eq("code", this.roomCode);
  }

  async setGame(game: RoomGame, payload: Record<string, unknown> = {}) {
    if (!this.roomCode) return;
    const { data } = await this.supabase.from("tempo_rooms").select("payload").eq("code", this.roomCode).single();
    const merged = {
      ...(data?.payload as object),
      ...payload,
      phase: "launch",
      launchedAt: Date.now(),
    };
    const { error } = await this.supabase
      .from("tempo_rooms")
      .update({ game, payload: merged, updated_at: new Date().toISOString() })
      .eq("code", this.roomCode);
    if (error) throw new Error(error.message);
  }

  async leaveRoom(playerId: string) {
    if (!this.roomCode) return;
    const { data } = await this.supabase.from("tempo_rooms").select("players").eq("code", this.roomCode).single();
    const players = ((data?.players as { id: string; name: string }[]) || []).filter((p) => p.id !== playerId);
    await this.supabase
      .from("tempo_rooms")
      .update({ players, updated_at: new Date().toISOString() })
      .eq("code", this.roomCode);
  }

  getRoomCode() {
    return this.roomCode;
  }

  close() {
    this.channel?.unsubscribe();
    this.channel = null;
  }
}

