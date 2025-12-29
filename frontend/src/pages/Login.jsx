import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Login.css";

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) return setError("Email invalide");
    if (!password) return setError("Mot de passe requis");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res?.data?.token;
      const userData = res?.data?.user;
      if (token) {
        login(token, userData); // met à jour le contexte + stocke le token + données utilisateur
        navigate("/");
      } else {
        setError("Réponse inattendue du serveur");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>Connexion</h2>
        {error && <div className="login-error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
