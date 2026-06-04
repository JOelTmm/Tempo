import http from "node:http";
import { URL } from "node:url";

export type OAuthProvider = "spotify" | "deezer";

export interface OAuthTokens {
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface PendingOAuth {
  provider: OAuthProvider;
  resolve: (tokens: OAuthTokens) => void;
  reject: (err: Error) => void;
}

const PORT = 3000;
const REDIRECT_PATH = "/callback";

let server: http.Server | null = null;
let pending: PendingOAuth | null = null;

function htmlPage(title: string, message: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:Segoe UI,sans-serif;background:#0B0E1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{background:#12182B;border:1px solid #00A5D6;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 0 30px rgba(0,165,214,.4)}
h1{color:#F15C22}</style></head><body><div class="card"><h1>Tempo</h1><p>${message}</p><p>Vous pouvez fermer cette fenêtre.</p></div></body></html>`;
}

/** Spotify exige 127.0.0.1 — pas "localhost" (erreur "not secure"). */
export const OAUTH_HOST = "127.0.0.1";

export function getRedirectUri() {
  return `http://${OAUTH_HOST}:${PORT}${REDIRECT_PATH}`;
}

export function startOAuthServer(): Promise<void> {
  if (server) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        if (!req.url) return;
        const url = new URL(req.url, `http://${OAUTH_HOST}:${PORT}`);

        if (url.pathname !== REDIRECT_PATH) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        if (!pending) {
          res.writeHead(400);
          res.end(htmlPage("Erreur", "Aucune connexion en attente."));
          return;
        }

        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
        const hashParams = new URLSearchParams(hash);
        const queryParams = url.searchParams;

        const accessToken =
          hashParams.get("access_token") ||
          queryParams.get("access_token") ||
          undefined;
        const code = queryParams.get("code") || undefined;
        const error = queryParams.get("error") || hashParams.get("error");

        if (error) {
          pending.reject(new Error(error));
          pending = null;
          res.writeHead(400);
          res.end(htmlPage("Échec", `Connexion refusée : ${error}`));
          stopOAuthServer();
          return;
        }

        if (pending.provider === "deezer" && accessToken) {
          const tokens: OAuthTokens = {
            provider: "deezer",
            accessToken,
          };
          pending.resolve(tokens);
          pending = null;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(htmlPage("Connecté", "Deezer relié à Tempo avec succès !"));
          stopOAuthServer();
          return;
        }

        if (pending.provider === "spotify" && (accessToken || code)) {
          const tokens: OAuthTokens = {
            provider: "spotify",
            accessToken: accessToken || "",
            refreshToken: queryParams.get("refresh_token") || undefined,
          };
          if (code && !accessToken) {
            tokens.accessToken = `code:${code}`;
          }
          pending.resolve(tokens);
          pending = null;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(htmlPage("Connecté", "Spotify relié à Tempo avec succès !"));
          stopOAuthServer();
          return;
        }

        res.writeHead(400);
        res.end(htmlPage("Erreur", "Réponse OAuth invalide."));
      } catch (e) {
        res.writeHead(500);
        res.end("Server error");
        if (pending) {
          pending.reject(e instanceof Error ? e : new Error(String(e)));
          pending = null;
        }
      }
    });

    server.listen(PORT, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });
}

export function waitForOAuthCallback(provider: OAuthProvider, timeoutMs = 120000): Promise<OAuthTokens> {
  return new Promise((resolve, reject) => {
    pending = { provider, resolve, reject };
    const timer = setTimeout(() => {
      if (pending) {
        pending.reject(new Error("Délai OAuth dépassé"));
        pending = null;
        stopOAuthServer();
      }
    }, timeoutMs);
    const wrapResolve = (t: OAuthTokens) => {
      clearTimeout(timer);
      resolve(t);
    };
    const wrapReject = (e: Error) => {
      clearTimeout(timer);
      reject(e);
    };
    if (pending) {
      pending.resolve = wrapResolve;
      pending.reject = wrapReject;
    }
  });
}

export function stopOAuthServer() {
  if (server) {
    server.close();
    server = null;
  }
  pending = null;
}