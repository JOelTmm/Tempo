import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const text = readFileSync(envPath, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ .env manquant ou incomplet. Lancez: npm run setup:supabase");
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/tempo_rooms?select=code&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (res.ok) {
  const data = await res.json();
  console.log("✅ Supabase OK — table tempo_rooms accessible");
  console.log(`   URL: ${url}`);
  console.log(`   Lignes test: ${Array.isArray(data) ? data.length : 0}`);
  process.exit(0);
}

const body = await res.text();
console.error("❌ Erreur Supabase:", res.status, body.slice(0, 200));
if (res.status === 404 || body.includes("42P01")) {
  console.error("→ Exécutez supabase/schema.sql dans le SQL Editor Supabase");
} else if (body.includes("42703") || body.includes("code does not exist")) {
  console.error("→ Mauvais schéma : exécutez supabase/FIX-TABLE.sql (drop + recréation)");
}
process.exit(1);