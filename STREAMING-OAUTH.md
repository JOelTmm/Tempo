# Connexion Spotify & Deezer

## Erreurs courantes

| Message | Cause | Solution |
|---------|--------|----------|
| `response_type must be code` | Ancienne URL Spotify | Tempo utilise maintenant le flux **PKCE** — relancez l'app après mise à jour |
| `Unknown app_id provided` | `DEEZER_APP_ID` vide ou invalide | Renseignez votre App ID dans `.env` |

## Configuration

1. Ouvrez `C:\Users\User\Tempo\.env`
2. Copiez depuis `.env.example` et remplissez :

```
SPOTIFY_CLIENT_ID=...
DEEZER_APP_ID=...
```

3. **Redirect URI Spotify** (obligatoire) : `http://127.0.0.1:3000/callback` — **pas** `localhost` (Spotify affiche « not secure »)
4. Redémarrez Tempo (fermez puis rouvrez le raccourci Bureau)

## Spotify Developer

- Créez une app sur https://developer.spotify.com/dashboard
- Type : Desktop ou Web API
- Redirect URIs : `http://127.0.0.1:3000/callback`

## Deezer Developers

- Créez une app sur https://developers.deezer.com/myapps
- Domain / Redirect : `http://127.0.0.1:3000/callback` (si création d'app disponible)

## Deezer — apps fermées

Deezer n'accepte plus de nouvelles applications OAuth pour le moment. **Tempo utilise quand même l'API publique Deezer** (recherche, playlists, blind test) sans connexion compte. Seules les fonctions « ajouter aux favoris Deezer » nécessitent un App ID.