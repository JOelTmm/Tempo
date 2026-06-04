import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err = await login(email, password);
    if (err) setError(err);
    else navigate("/");
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <img src="./logo-tempo.jfif" alt="Tempo" className="mx-auto mb-6 h-24 w-24 rounded-full ring-4 ring-tempo-orange" />
      <h1 className="text-center font-display text-3xl font-bold text-gradient-tempo">Connexion</h1>
      <form onSubmit={submit} className="arena-card mt-6 space-y-4">
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
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-neon w-full">
          Entrer dans l&apos;Arène
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        Pas de compte ? <Link to="/register" className="text-tempo-blue hover:underline">S&apos;inscrire</Link>
      </p>
    </div>
  );
}