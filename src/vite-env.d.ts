/// <reference types="vite/client" />

import type { TempoAPI } from "../electron/preload";

declare global {
  interface Window {
    tempo: TempoAPI;
  }
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  previewUrl?: string;
  coverUrl?: string;
  provider: "deezer" | "spotify" | "local";
}

export type Difficulty = "facile" | "normal" | "difficile";
export type RoomGame = "flashquiz" | "rolengamos";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}