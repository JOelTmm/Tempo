# Configurer Supabase pour le multijoueur Internet — pas à pas

## Étape 1 — Créer un projet Supabase

1. Allez sur https://supabase.com et créez un compte (gratuit).
2. Cliquez **New project**.
3. Nom : `tempo-multijoueur` (ou autre).
4. Mot de passe base de données : notez-le (usage admin uniquement).
5. Région : choisissez la plus proche (ex. `West EU` pour la France).
6. Attendez 1–2 minutes que le projet soit **Active**.

## Étape 2 — Créer la table des salons

1. Menu gauche → **SQL Editor**.
2. **New query**.
3. Copiez-collez tout le fichier `supabase/schema.sql` du projet Tempo.
4. Cliquez **Run** (succès : `Success. No rows returned`).

## Étape 3 — Activer le temps réel (Realtime)

1. Menu **Database** → **Replication** (ou **Publications** selon l’UI).
2. Trouvez la table `tempo_rooms`.
3. Activez la réplication / Realtime pour cette table.

Sans cette étape, les joueurs ne verront pas les mises à jour en direct.

## Étape 4 — Récupérer les clés API

1. Menu **Project Settings** (engrenage) → **API**.
2. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

Ne partagez jamais la clé `service_role` dans l’app Electron côté client.

## Étape 5 — Configurer Tempo sur votre PC

Dans `C:\Users\User\Tempo`, créez un fichier `.env` :

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Redémarrez l’app :

```bash
cd C:\Users\User\Tempo
npm run dev
```

L’écran multijoueur affichera **« Mode Internet : Supabase actif »** en vert.

## Étape 6 — Tester à deux (deux PC ou deux comptes)

**Joueur A (hôte)**  
1. Connexion Tempo → FlashQuiz ou Rolengamos.  
2. **Créer un salon** → un code à 6 lettres s’affiche (ex. `XK4M9P`).  
3. Copier le code (bouton Copier).

**Joueur B (ami, autre maison / 4G)**  
1. Même version de Tempo avec le **même** `.env` Supabase.  
2. **Rejoindre** → coller le code.  
3. Les deux écrans se synchronisent via Supabase Realtime.

## Dépannage

| Problème | Solution |
|----------|----------|
| « Supabase non configuré » | Vérifiez `.env` et relancez `npm run dev` |
| Salon introuvable | Code en majuscules, table `tempo_rooms` créée |
| Pas de sync en direct | Realtime activé sur `tempo_rooms` |
| Erreur RLS | Relancez `schema.sql` (policies anon) |

## Sécurité (après la JPO)

En production, restreignez les policies RLS (auth utilisateur, salon = membres uniquement).