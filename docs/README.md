# Site de téléchargement Tempo (GitHub Pages)

Site statique simple : une page pour **télécharger l'app** et expliquer le **multijoueur en ligne**.

## 1. Activer GitHub Pages

1. Dépôt : **https://github.com/JOelTmm/Tempo**
2. **Une seule fois** : GitHub → **Settings → Pages** → Source **Deploy from a branch** → branche **`gh-pages`** → dossier **`/ (root)`**
3. À chaque push sur `main`, le workflow déploie `docs/` sur `gh-pages`
4. URL : **https://joeltmm.github.io/Tempo/**

## 2. Liens de téléchargement

Déjà configuré dans **`docs/config.js`** pour **JOelTmm/Tempo**.

## 3. Publier l'installateur

1. Sur votre PC, dans le projet :
   ```bash
   npm run dist:win
   ```
2. Fichiers générés dans `release/`
3. Sur GitHub : **Releases → Create a new release** (tag ex. `v1.0.0`)
4. Attachez les `.exe` avec les **mêmes noms** que dans `config.js`
5. Publiez la release — les boutons du site pointeront automatiquement vers la dernière version

## Fichiers du site

| Fichier | Rôle |
|---------|------|
| `index.html` | Page d'accueil |
| `style.css` | Style Tempo (bleu / orange / violet) |
| `config.js` | URL du dépôt GitHub + noms des exe |
| `site.js` | Liens de téléchargement dynamiques |
| `assets/logo-tempo.jfif` | Logo |