import { Link, useLocation } from "react-router-dom";
import { Gamepad2, Globe, Home, Music2, Sparkles, Type } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { isManager } = useAuth();
  const nav = [
    { to: isManager ? "/manager" : "/", icon: Home, label: "Accueil" },
    { to: "/online", icon: Globe, label: "En ligne" },
    { to: "/flashquiz", icon: Music2, label: "Quiz" },
    { to: "/rolengamos", icon: Gamepad2, label: "Roleng." },
    { to: "/pixelcover", icon: Sparkles, label: "Pixel" },
    { to: "/speed-lyrics", icon: Type, label: "Lyrics" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-tempo-border/80 bg-tempo-dark/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to={isManager ? "/manager" : "/"} className="flex items-center gap-3">
            <img src="./logo-tempo.jfif" alt="Tempo" className="h-9 w-9 rounded-full ring-2 ring-tempo-orange" />
            <span className="font-display text-lg font-bold text-gradient-tempo">TEMPO</span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-1">
            {nav.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-2 py-2 text-xs transition ${
                  loc.pathname === to ? "bg-tempo-blue/20 text-tempo-blue" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={14} className="mx-auto" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}