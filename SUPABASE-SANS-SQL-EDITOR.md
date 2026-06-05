# Créer tempo_rooms SANS l'éditeur SQL (si erreur API / titre)

## Méthode A — Table Editor (recommandé)

1. Ouvrez : https://supabase.com/dashboard/project/xuvtujchhchdvimtkyix/editor
2. **Table Editor** (menu gauche) → **New table**
3. Nom : `tempo_rooms`
4. Colonnes :

| Name | Type | Default | Primary |
|------|------|---------|---------|
| code | text | — | ✅ Primary |
| game | text | — | |
| host_id | text | — | |
| players | jsonb | `'[]'` | |
| payload | jsonb | `'{}'` | |
| updated_at | timestamptz | `now()` | |

5. Cochez **Enable Row Level Security (RLS)** → Save

6. Onglet **Policies** → **New policy** → templates :
   - SELECT : allow all (anon)
   - INSERT : allow all (anon)
   - UPDATE : allow all (anon)

## Méthode B — SQL minimal (1 seule ligne)

SQL Editor → nouvelle requête → collez UNIQUEMENT ceci (pas de commentaires) :

```sql
create table public.tempo_rooms (code text primary key, game text not null, host_id text not null, players jsonb default '[]', payload jsonb default '{}', updated_at timestamptz default now()); alter table public.tempo_rooms enable row level security;
```

Run. Ignorez l'erreur "Failed to generate title" si le résultat SQL est Success.

## Realtime

Database → Publications → `tempo_rooms` → activer Realtime

## Vérifier Tempo

```bash
cd C:\Users\User\Tempo
npm run verify:supabase
```