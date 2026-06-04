import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Shield, Users } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  xp: number;
  level: number;
}

export function ManagerDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    window.tempo.manager.users().then((r) => {
      if (r.ok) setUsers(r.users as UserRow[]);
    });
    window.tempo.manager.logs().then((r) => {
      if (r.ok) setLogs(r.logs);
    });
  }, []);

  async function saveScore(u: UserRow) {
    const res = await window.tempo.manager.updateScore(u.id, u.xp, u.level);
    setMsg(res.ok ? "Score mis à jour" : res.error || "Erreur");
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Link to="/arena" className="btn-neon inline-flex items-center gap-2">
        <Gamepad2 size={18} /> Mode Arène (jeux)
      </Link>

      <div className="flex items-center gap-3">
        <Shield className="text-tempo-orange" size={32} />
        <div>
          <h1 className="font-display text-3xl font-bold text-tempo-orange">Mode Manager</h1>
          <p className="text-sm text-slate-400">Administration Tempo — accès exclusif</p>
        </div>
      </div>

      <section className="arena-card">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Users size={20} /> Utilisateurs ({users.length})
        </h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-tempo-border p-3">
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold">{u.displayName}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
                <p className="text-xs text-tempo-violet">{u.role}</p>
              </div>
              <label className="text-xs">
                XP
                <input
                  type="number"
                  className="ml-2 w-20 rounded border border-tempo-border bg-tempo-dark px-2 py-1"
                  value={u.xp}
                  onChange={(e) =>
                    setUsers((list) =>
                      list.map((x) => (x.id === u.id ? { ...x, xp: Number(e.target.value) } : x))
                    )
                  }
                />
              </label>
              <label className="text-xs">
                Niveau
                <input
                  type="number"
                  className="ml-2 w-16 rounded border border-tempo-border bg-tempo-dark px-2 py-1"
                  value={u.level}
                  onChange={(e) =>
                    setUsers((list) =>
                      list.map((x) => (x.id === u.id ? { ...x, level: Number(e.target.value) } : x))
                    )
                  }
                />
              </label>
              <button type="button" className="btn-neon text-xs" onClick={() => saveScore(u)}>
                Enregistrer
              </button>
            </div>
          ))}
        </div>
        {msg && <p className="mt-2 text-sm text-tempo-blue">{msg}</p>}
      </section>

      <section className="arena-card">
        <h2 className="mb-2 font-display text-lg font-bold">Logs système</h2>
        <ul className="font-mono text-xs text-slate-400">
          {logs.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}