/**
 * Applique supabase/schema.sql si SUPABASE_DB_URL est dans .env
 * Récupérez l'URI : Dashboard → Settings → Database → Connection string → URI
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.log("ℹ️  Ajoutez SUPABASE_DB_URL dans .env pour appliquer le SQL automatiquement.");
  console.log("   Sinon : SQL Editor → coller supabase/schema.sql → Run");
  process.exit(0);
}

const sql = readFileSync(join(root, "supabase", "schema.sql"), "utf8");
const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("✅ schema.sql appliqué — table tempo_rooms créée");
} catch (e) {
  console.error("❌ Erreur SQL:", e.message);
  process.exit(1);
} finally {
  await client.end();
}