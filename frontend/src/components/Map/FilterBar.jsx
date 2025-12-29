// src/components/Map/FilterBar.jsx
import React, { useState } from "react";
import "../../styles/FilterBar.css";
import Legend from "./Legend";

const CONTAINER_TYPES = [
  { value: "Verre", label: "Verre 🔵", color: "#2196F3" },
  { value: "Papier", label: "Papier 🟠", color: "#FF9800" },
  { value: "Plastique", label: "Plastique 🟢", color: "#4CAF50" },
  { value: "Ordures", label: "Ordures 🟣", color: "#9C27B0" },
];

const CONTAINER_STATUS = [
  { value: "vide", label: "Vide 🟢" },
  { value: "presque_plein", label: "Presque plein 🟡" },
  { value: "plein", label: "Plein 🔴" },
  { value: "hors_service", label: "Hors service ⚫" },
];

const DISTANCE_OPTIONS = [
  { value: 0, label: "Tous les conteneurs" },
  { value: 500, label: "Dans 500m" },
  { value: 1000, label: "Dans 1km" },
  { value: 2000, label: "Dans 2km" },
  { value: 5000, label: "Dans 5km" },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  userPosition,
  isMobileOpen,
  onMobileOpenChange,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Détecter les changements de taille d'écran
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        onMobileOpenChange(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onMobileOpenChange]);

  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });

    // Fermer le drawer sur mobile après changement
    if (isMobile) {
      setTimeout(() => onMobileOpenChange(false), 300);
    }
  };

  const handleStatusToggle = (status) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });

    // Fermer le drawer sur mobile après changement
    if (isMobile) {
      setTimeout(() => onMobileOpenChange(false), 300);
    }
  };

  const handleDistanceChange = (distance) => {
    onFiltersChange({ ...filters, distance });

    // Fermer le drawer sur mobile après changement
    if (isMobile) {
      setTimeout(() => onMobileOpenChange(false), 300);
    }
  };

  const handleResetFilters = () => {
    onFiltersChange({
      types: [],
      status: [],
      distance: 0,
    });

    // Fermer le drawer sur mobile après réinitialisation
    if (isMobile) {
      setTimeout(() => onMobileOpenChange(false), 300);
    }
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.status.length > 0 ||
    filters.distance > 0;

  return (
    <>
      {/* Overlay pour mobile */}
      {isMobile && isMobileOpen && (
        <div
          className="filter-overlay"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      <div className={`filter-bar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Header avec toggle */}
        <div className="filter-header">
          <button
            className="filter-toggle"
            onClick={() => onMobileOpenChange(!isMobileOpen)}
          >
            <span className="filter-icon">⚙️</span>
            <span className="filter-text">Filtres</span>
            {hasActiveFilters && (
              <span className="filter-badge">
                {(filters.types.length > 0 ? 1 : 0) +
                  (filters.status.length > 0 ? 1 : 0) +
                  (filters.distance > 0 ? 1 : 0)}
              </span>
            )}
            {isMobile && (
              <span
                className={`filter-chevron ${isMobileOpen ? "expanded" : ""}`}
              >
                ▼
              </span>
            )}
          </button>

          {/* Bouton de fermeture - visible sur mobile */}
          {isMobile && (
            <button
              className="filter-close-btn"
              onClick={() => onMobileOpenChange(false)}
              title="Fermer les filtres"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contenu des filtres */}
        {(!isMobile || isMobileOpen) && (
          <div className="filter-content">
            {/* Section Type */}
            <div className="filter-section">
              <h4 className="filter-section-title">
                📦 Type de conteneur
                {filters.types.length > 0 && (
                  <span className="section-count">
                    ({filters.types.length})
                  </span>
                )}
              </h4>
              <div className="filter-options">
                {CONTAINER_TYPES.map((type) => (
                  <label key={type.value} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type.value)}
                      onChange={() => handleTypeToggle(type.value)}
                    />
                    <span
                      className="filter-color"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="filter-label">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section État */}
            <div className="filter-section">
              <h4 className="filter-section-title">
                🔔 État du conteneur
                {filters.status.length > 0 && (
                  <span className="section-count">
                    ({filters.status.length})
                  </span>
                )}
              </h4>
              <div className="filter-options">
                {CONTAINER_STATUS.map((status) => (
                  <label key={status.value} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status.value)}
                      onChange={() => handleStatusToggle(status.value)}
                    />
                    <span className="filter-label">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section Distance */}
            {userPosition && (
              <div className="filter-section">
                <h4 className="filter-section-title">
                  📍 Distance
                  {filters.distance > 0 && (
                    <span className="section-count">({filters.distance}m)</span>
                  )}
                </h4>
                <div className="filter-distance">
                  {DISTANCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`distance-option ${filters.distance === option.value ? "active" : ""}`}
                      onClick={() => handleDistanceChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Légende */}
            <div className="filter-section">
              <h4 className="filter-section-title">🎨 Légende</h4>
              <Legend />
            </div>

            {/* Bouton Réinitialiser */}
            {hasActiveFilters && (
              <button className="filter-reset" onClick={handleResetFilters}>
                ✕ Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
