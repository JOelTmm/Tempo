import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { MANAGER_EMAIL } from "./constants";
import {
  clearSession,
  getSession,
  loadSessionFromDisk,
  setSession,
  type UserSession,
} from "./session-store";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "player" | "manager";
  xp: number;
  level: number;
  createdAt: string;
}

interface UserDb {
  users: AuthUser[];
}

function dbPath() {
  return path.join(app.getPath("userData"), "users.json");
}

function readDb(): UserDb {
  try {
    return JSON.parse(fs.readFileSync(dbPath(), "utf8")) as UserDb;
  } catch {
    return { users: [] };
  }
}

function writeDb(db: UserDb) {
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true });
  fs.writeFileSync(dbPath(), JSON.stringify(db, null, 2), "utf8");
}

function roleForEmail(email: string): "player" | "manager" {
  return email.trim().toLowerCase() === MANAGER_EMAIL.toLowerCase() ? "manager" : "player";
}

function toSession(user: AuthUser): UserSession {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export function initAuth() {
  loadSessionFromDisk();
}

export function getCurrentAuth() {
  const s = getSession();
  if (!s) return null;
  const db = readDb();
  const user = db.users.find((u) => u.id === s.userId);
  return {
    userId: s.userId,
    email: s.email,
    displayName: s.displayName,
    role: s.role,
    xp: user?.xp ?? 0,
    level: user?.level ?? 1,
    streaming: {
      spotify: Boolean(s.spotify?.accessToken),
      deezer: Boolean(s.deezer?.accessToken),
    },
  };
}

export async function registerUser(email: string, password: string, displayName: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || password.length < 6) {
    return { ok: false as const, error: "Email ou mot de passe invalide (min. 6 caractères)" };
  }

  const db = readDb();
  if (db.users.some((u) => u.email === normalized)) {
    return { ok: false as const, error: "Cet email est déjà utilisé" };
  }

  const user: AuthUser = {
    id: uuidv4(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 10),
    displayName: displayName.trim() || normalized.split("@")[0],
    role: roleForEmail(normalized),
    xp: 0,
    level: 1,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  writeDb(db);
  setSession(toSession(user));
  return { ok: true as const, user: getCurrentAuth() };
}

export async function loginUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const db = readDb();
  const user = db.users.find((u) => u.email === normalized);
  if (!user) return { ok: false as const, error: "Identifiants incorrects" };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false as const, error: "Identifiants incorrects" };

  user.role = roleForEmail(normalized);
  writeDb(db);
  setSession(toSession(user));
  return { ok: true as const, user: getCurrentAuth() };
}

export function logoutUser() {
  clearSession();
  return { ok: true };
}

export function listUsersForManager() {
  const s = getSession();
  if (!s || s.role !== "manager") return { ok: false as const, error: "Accès refusé" };
  return { ok: true as const, users: readDb().users.map(({ passwordHash: _, ...u }) => u) };
}

export function updateUserScore(userId: string, xp: number, level: number) {
  const s = getSession();
  if (!s || s.role !== "manager") return { ok: false as const, error: "Accès refusé" };
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false as const, error: "Utilisateur introuvable" };
  user.xp = xp;
  user.level = level;
  writeDb(db);
  return { ok: true };
}

export function getSystemLogs() {
  const s = getSession();
  if (!s || s.role !== "manager") return { ok: false as const, error: "Accès refusé" };
  return {
    ok: true as const,
    logs: [
      `[${new Date().toISOString()}] Session manager: ${s.email}`,
      `[${new Date().toISOString()}] Utilisateurs: ${readDb().users.length}`,
      `[${new Date().toISOString()}] OAuth: stockage chiffré safeStorage`,
    ],
  };
}