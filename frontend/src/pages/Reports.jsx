// src/pages/Reports.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createReport } from "../services/reportService";
import { getContainerById } from "../services/containerService";
import "../styles/Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerId = searchParams.get("containerId");
  const containerType = searchParams.get("type");

  const [formData, setFormData] = useState({
    containerId: containerId || "",
    latitude: "",
    longitude: "",
    description: "",
    reportType: "CONTENEUR_PLEIN",
  });

  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Récupérer les infos du conteneur si ID fourni
  useEffect(() => {
    const fetchContainer = async () => {
      if (containerId) {
        try {
          const data = await getContainerById(containerId);
          setContainer(data);
          setFormData((prev) => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
          }));
        } catch (err) {
          console.error("Erreur lors de la récupération du conteneur:", err);
        }
      }
      setLoading(false);
    };

    fetchContainer();
  }, [containerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation basique
      if (!formData.containerId) {
        throw new Error("ID du conteneur requis");
      }
      if (!formData.latitude || !formData.longitude) {
        throw new Error("Latitude et longitude requises");
      }

      const reportPayload = {
        containerId: formData.containerId,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      await createReport(reportPayload);
      setSuccess(true);

      // Redirection après succès
      setTimeout(() => {
        navigate("/map");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'envoi du rapport";
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-wrapper">
        {/* Retour */}
        <button className="back-button" onClick={() => navigate("/map")}>
          ← Retour à la carte
        </button>

        {/* Header */}
        <div className="reports-header">
          <h1>Signaler un problème</h1>
          <p>Aidez-nous à maintenir les conteneurs en bon état</p>
        </div>

        {/* Formulaire */}
        <form className="report-form" onSubmit={handleSubmit}>
          {/* Messages */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <p className="alert-title">Erreur</p>
                <p className="alert-message">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              <div className="alert-content">
                <p className="alert-title">Succès</p>
                <p className="alert-message">
                  Votre rapport a été envoyé avec succès. Merci!
                </p>
              </div>
            </div>
          )}

          {/* Infos du conteneur */}
          {container && (
            <div className="section">
              <h3>📦 Conteneur</h3>
              <div className="container-info">
                <div className="info-item">
                  <label>Type</label>
                  <div className="info-value">{container.type}</div>
                </div>
                <div className="info-item">
                  <label>Statut actuel</label>
                  <div className="info-value">{container.status}</div>
                </div>
                <div className="info-item">
                  <label>ID</label>
                  <div className="info-value info-monospace">
                    {container.id}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Localisation */}
          <div className="section">
            <h3>📍 Localisation</h3>
            <div className="form-group">
              <label htmlFor="containerId">
                ID du conteneur <span className="required">*</span>
              </label>
              <input
                type="text"
                id="containerId"
                name="containerId"
                value={formData.containerId}
                onChange={handleInputChange}
                placeholder="ID unique du conteneur"
                disabled={!!containerId}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">
                  Latitude <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="48.8566"
                  step="0.0001"
                  min="-90"
                  max="90"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitude">
                  Longitude <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="2.3522"
                  step="0.0001"
                  min="-180"
                  max="180"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section Type de rapport */}
          <div className="section">
            <h3>🔔 Type de rapport</h3>
            <div className="form-group">
              <label htmlFor="reportType">
                Type de problème <span className="required">*</span>
              </label>
              <select
                id="reportType"
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
              >
                <option value="CONTENEUR_PLEIN">Conteneur plein</option>
                <option value="CONTENEUR_ENDOMMAGE">Conteneur endommagé</option>
                <option value="DETRITUS_AUTOUR">Détritus autour</option>
                <option value="AUTRE">Autre problème</option>
              </select>
            </div>
          </div>

          {/* Section Description */}
          <div className="section">
            <h3>📝 Description (optionnel)</h3>
            <div className="form-group">
              <label htmlFor="description">
                Décrivez le problème en détail
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Exemple: Le conteneur est endommagé sur le côté gauche..."
                rows="4"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/map")}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={submitting || success}
            >
              {submitting ? (
                <>
                  <span className="button-spinner">⏳</span>
                  Envoi en cours...
                </>
              ) : success ? (
                <>
                  <span>✓</span>
                  Rapport envoyé
                </>
              ) : (
                <>
                  <span>📋</span>
                  Envoyer le rapport
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info additionnelle */}
        <div className="reports-footer">
          <p>
            💡 Vos rapports aident notre communauté à maintenir un environnement
            plus propre. Chaque signalement validé vous rapportera des points!
          </p>
        </div>
      </div>
    </div>
  );
}
