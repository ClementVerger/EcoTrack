import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link
            to="/"
            style={{
              marginRight: "1rem",
              fontWeight: "bold",
              color: "#2e7d32",
            }}
          >
            🌱 EcoTrack
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isAuthenticated && (
            <>
              <Link to="/login" style={{ marginRight: "0.5rem" }}>
                Connexion
              </Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
          {isAuthenticated && (
            <>
              {user && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    backgroundColor: "#e8f5e9",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>{user.firstname}</span>
                  <span
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                  >
                    ⭐ {user.points ?? 0} pts
                  </span>
                  <span
                    style={{
                      backgroundColor: "#ff9800",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                  >
                    Niv. {user.level ?? 1}
                  </span>
                </div>
              )}
              <button
                onClick={onLogout}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
