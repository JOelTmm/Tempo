const STORAGE_KEY = "tempo-profile";

export interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
}

const defaultProfile: UserProfile = {
  name: "Joueur",
  avatar: "🎧",
  xp: 420,
  level: 3,
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...defaultProfile };
}

export function saveProfile(p: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function addXp(amount: number): UserProfile {
  const p = loadProfile();
  p.xp += amount;
  const next = p.level * 200;
  if (p.xp >= next) {
    p.level += 1;
    p.xp -= next;
  }
  saveProfile(p);
  return p;
}