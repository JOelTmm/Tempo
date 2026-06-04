# Tempo — Votre Arène Musicale

Application desktop **Electron + React + TypeScript + Tailwind**.

## Site web de téléchargement (GitHub Pages)

Un mini-site est dans le dossier **`docs/`** — une page pour télécharger l'app, hébergée gratuitement sur GitHub.

1. Modifiez `docs/config.js` (votre `utilisateur/repo` GitHub)
2. GitHub → **Settings → Pages** → source **main** / dossier **docs**
3. URL : `https://votre-utilisateur.github.io/Tempo/`

Guide détaillé : **`docs/README.md`**

## Télécharger / installer Tempo (Windows)

Pour créer l'installateur à mettre sur GitHub Releases :

```powershell
cd C:\Users\User\Tempo
npm install
npm run dist:win
```

Les fichiers apparaissent dans **`release/`** — attachez-les à une **Release** GitHub (voir `docs/README.md`).

## Jeu en ligne (multijoueur)

1. Connectez-vous avec un compte Tempo
2. Menu **En ligne** ou carte **Jouer en ligne** sur l'accueil
3. Choisissez le jeu → **Créer un salon** → partagez le **code** à un ami
4. L'ami installe Tempo, se connecte, **En ligne** → **Rejoindre** avec le code

Avec **Supabase** configuré (`.env`) : jeu à distance via Internet.  
Sans Supabase : salon **local** (même réseau Wi‑Fi, port 9876).

Guide : `docs/SUPABASE_SETUP.md`

## Lancer l'application (développement)

### Raccourci Bureau (recommandé)
Double-cliquez sur **Tempo** sur le Bureau (raccourci personnalisé avec votre logo).

Ou recréez-le :
```powershell
cd C:\Users\User\Tempo
npm run desktop
```

### VS Code / terminal
```bash
cd C:\Users\User\Tempo
npm install
npm run dev
```

## Compte & Mode Manager

| Email | Mode |
|-------|------|
| `joel.traina-metogo-messina@laplateforme.io` | **Manager** — Dashboard admin exclusif |
| Tout autre email | **Joueur** — Arène standard |

Inscription / connexion par **email + mot de passe** sur `/login` et `/register`.

## Spotify + Deezer en même temps

Les deux tokens sont stockés **chiffrés** (`safeStorage`) dans `session.json` liés à votre compte Tempo. Liez Spotify puis Deezer depuis l'accueil (les deux peuvent être actifs simultanément).

Variables optionnelles :
```powershell
$env:SPOTIFY_CLIENT_ID="..."
$env:DEEZER_APP_ID="..."
```

Redirect URI des deux plateformes : `http://localhost:3000/callback`

## Multijoueur Internet (Supabase)

Guide complet pas à pas : **`docs/SUPABASE_SETUP.md`**

Résumé :
1. Créer un projet sur https://supabase.com
2. Exécuter `supabase/schema.sql` dans le SQL Editor
3. Activer **Realtime** sur la table `tempo_rooms`
4. Créer `.env` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```
5. Relancer `npm run dev` — l’UI affiche « Supabase actif »

Sans Supabase : salons **locaux** (même Wi‑Fi, port 9876).

## Icône Bureau & barre des tâches

```bash
npm run desktop
```

Génère `public/logo-tempo.ico` et met à jour le raccourci **Tempo** sur le Bureau.  
Si la barre des tâches affiche encore l’ancienne icône : fermez Tempo, relancez via le raccourci, ou réépinglez l’app.

## Jeux

- **FlashQuiz** — recherche playlist/artiste API, blind test 30s
- **Rolengamos** — featurings (JSON + Deezer + Spotify), IA / 2 joueurs / en ligne
- **PixelCover** — 15s max, flou rapide
- **Sample Hunter** — retrouver le sample
- **Speed Lyrics** — mot manquant en 5s

## Structure

```
electron/     Main, OAuth, auth, rooms WS, APIs
src/          React UI
scripts/      Raccourci bureau
```