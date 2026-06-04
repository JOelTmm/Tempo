import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err = await register(email, password, name);
    if (err) setError(err);
    else navigate("/");
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <h1 className="text-center font-display text-3xl font-bold text-gradient-tempo">Inscription</h1>
      <form onSubmit={submit} className="arena-card mt-6 space-y-4">
        <input
          className="w-full rounded-xl border border-tempo-border bg-tempo-dark px-4 py-3"
          placeholder="Pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="w-full rounded-xl border border-tempo-border bg-tempo-dark px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-xl border border-tempo-border bg-tempo-dark px-4 py-3"
          placeholder="Mot de passe (6+ caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-orange w-full">
          Créer mon compte
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        Déjà inscrit ? <Link to="/login" className="text-tempo-blue hover:underline">Connexion</Link>
      </p>
    </div>
  );
}