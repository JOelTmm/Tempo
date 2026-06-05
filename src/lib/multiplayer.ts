import type { RoomGame } from "../vite-env";

export type RoomMessage =
  | { type: "room:created"; room: RoomState }
  | { type: "room:joined"; room: RoomState }
  | { type: "room:update"; room: RoomState }
  | { type: "room:sync"; room: RoomState }
  | { type: "room:state"; room: RoomState }
  | { type: "error"; message: string };

export interface RoomState {
  code: string;
  game: RoomGame;
  hostId: string;
  players: { id: string; name: string }[];
  payload: Record<string, unknown>;
  updatedAt: number;
}

export type MultiplayerMode = "supabase" | "local";

/** Client unifié : Supabase (Internet) ou WebSocket local */
export interface GameRoomClient {
  mode: MultiplayerMode;
  sync: (payload: Record<string, unknown>) => void | Promise<void>;
  setGame?: (game: RoomGame, payload?: Record<string, unknown>) => void | Promise<void>;
  leave?: (playerId: string) => void | Promise<void>;
  getCode?: () => string;
  close: () => void;
  onRoomUpdate: (fn: (room: RoomState) => void) => () => void;
}

const DEFAULT_PORT = 9876;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners: ((msg: RoomMessage) => void)[] = [];

  constructor(private host = "127.0.0.1", private port = DEFAULT_PORT) {}

  connect() {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(`ws://${this.host}:${this.port}`);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error("Connexion salon impossible"));
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as RoomMessage;
          this.listeners.forEach((fn) => fn(msg));
        } catch {
          /* ignore */
        }
      };
    });
  }

  onMessage(fn: (msg: RoomMessage) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  send(data: object) {
    this.ws?.send(JSON.stringify(data));
  }

  createRoom(game: RoomGame, playerName: string, playerId: string) {
    this.send({ type: "room:create", game, playerName, playerId });
  }

  joinRoom(code: string, playerName: string, playerId: string) {
    this.send({ type: "room:join", roomCode: code.toUpperCase(), playerName, playerId });
  }

  sync(roomCode: string, payload: Record<string, unknown>) {
    this.send({ type: "room:sync", roomCode, payload });
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}

export { getSupabaseConfig, isSupabaseConfigured } from "./supabase-config";
export { SupabaseMultiplayerClient } from "./supabase-multiplayer";