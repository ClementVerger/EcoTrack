// src/components/Map/ContainerDetailPanel.jsx
import React, { useState } from "react";
import "../../styles/ContainerDetailPanel.css";

const getStatusLabel = (status) => {
  const labels = {
    vide: "🟢 Vide",
    presque_plein: "🟡 Presque plein",
    plein: "🔴 Plein",
    hors_service: "⚫ Hors service",
  };
  return labels[status] || status;
};

const getStatusDescription = (status) => {
  const descriptions = {
    vide: "Le conteneur est vide et prêt à recevoir des déchets",
    presque_plein:
      "Le conteneur est presque plein et nécessitera une collecte bientôt",
    plein: "Le conteneur est plein et doit être vidé rapidement",
    hors_service: "Le conteneur est hors service et ne peut pas être utilisé",
  };
  return descriptions[status] || "";
};

const getTypeColor = (type) => {
  const colors = {
    Verre: "#2196F3",
    Papier: "#FF9800",
    Plastique: "#4CAF50",
    Ordures: "#9C27B0",
  };
  return colors[type] || "#808080";
};

export default function ContainerDetailPanel({ container, onClose, onReport }) {
  const [isReporting, setIsReporting] = useState(false);
  const [reportStatus, setReportStatus] = useState(null); // 'success', 'error', or null

  if (!container) return null;

  const fillLevel = container.fillLevel || 0;
  const fillColor =
    fillLevel < 50 ? "#4CAF50" : fillLevel < 80 ? "#FF9800" : "#F44336";

  const handleReportClick = async () => {
    setIsReporting(true);
    setReportStatus(null);

    try {
      // Appeler la fonction onReport
      await onReport(container);
      setReportStatus("success");
      // Fermer le panneau après succès
      setTimeout(() => {
        setIsReporting(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Erreur lors du rapport:", error);
      setReportStatus("error");
      setIsReporting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="container-panel-overlay" onClick={onClose} />

      {/* Panneau */}
      <div className="container-detail-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title-section">
            <div
              className="container-type-badge"
              style={{ backgroundColor: getTypeColor(container.type) }}
            >
              {container.type.charAt(0).toUpperCase()}
            </div>
            <div className="panel-title">
              <h2>{container.type}</h2>
              <p className="container-id">
                ID: {container.id.substring(0, 12)}...
              </p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="panel-content">
          {/* Statut */}
          <div className="detail-section">
            <h3>Statut</h3>
            <div
              className="status-badge"
              style={{ borderLeftColor: getTypeColor(container.type) }}
            >
              <span className="status-emoji">
                {getStatusLabel(container.status).split(" ")[0]}
              </span>
              <div className="status-info">
                <span className="status-label">
                  {getStatusLabel(container.status)
                    .split(" ")
                    .slice(1)
                    .join(" ")}
                </span>
                <span className="status-description">
                  {getStatusDescription(container.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Remplissage */}
          <div className="detail-section">
            <h3>Niveau de remplissage</h3>
            <div className="fill-level-container">
              <div className="fill-level-label">
                <span className="fill-percentage">{fillLevel}%</span>
                <span className="fill-capacity">/ {container.capacity}%</span>
              </div>
              <div className="progress-bar-large">
                <div
                  className="progress-fill-large"
                  style={{ width: `${fillLevel}%`, backgroundColor: fillColor }}
                />
              </div>
              <div className="fill-status-text">
                {fillLevel < 50
                  ? "✅ Conteneur disponible"
                  : fillLevel < 80
                    ? "⚠️ Bientôt plein"
                    : "🚨 À vider prioritairement"}
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="detail-section">
            <h3>Localisation</h3>
            <div className="location-info">
              <div className="location-row">
                <span className="location-label">Latitude :</span>
                <span className="location-value">
                  {container.latitude.toFixed(4)}°
                </span>
              </div>
              <div className="location-row">
                <span className="location-label">Longitude :</span>
                <span className="location-value">
                  {container.longitude.toFixed(4)}°
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="detail-section">
            <h3>Actions</h3>
            {reportStatus === "success" && (
              <div className="status-message success">
                <span className="message-icon">✓</span>
                <span className="message-text">Rapport envoyé avec succès</span>
              </div>
            )}
            {reportStatus === "error" && (
              <div className="status-message error">
                <span className="message-icon">!</span>
                <span className="message-text">
                  Erreur lors de l'envoi du rapport
                </span>
              </div>
            )}
            <button
              className="action-button report-button"
              onClick={handleReportClick}
              disabled={isReporting}
            >
              {isReporting ? (
                <>
                  <span className="button-icon spinner">⏳</span>
                  <span className="button-text">Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">📋</span>
                  <span className="button-text">Signaler un problème</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="panel-footer">
          <p className="footer-text">
            Cliquez sur "Signaler un problème" si vous observez une anomalie
          </p>
        </div>
      </div>
    </>
  );
}
