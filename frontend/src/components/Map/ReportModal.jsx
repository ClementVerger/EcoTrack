import React, { useState } from 'react';
import '../../styles/ReportModal.css';

/**
 * Composant modal pour signaler un problème
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onSubmit - Callback de soumission
 * @param {boolean} props.isLoading - État de chargement
 * @param {string} props.error - Message d'erreur
 * @param {Object} props.location - Position GPS {latitude, longitude}
 * @param {string} props.containerId - ID du conteneur (optionnel)
 * @param {Array} props.containers - Liste des conteneurs (optionnel)
 */
function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  location,
  containerId,
  containers = [],
}) {
  const [formData, setFormData] = useState({
    description: '',
    category: 'autre',
    severity: 'normal',
    containerId: containerId || '',
    latitude: location?.latitude || '',
    longitude: location?.longitude || '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingPosition, setEditingPosition] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError(null);
      return;
    }

    // Validation du type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setPhotoError('Fichier trop volumineux. Maximum 5MB');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Créer une preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
      setPhotoFile(file);
      setPhotoError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.description.trim()) {
      errors.description = 'La description est obligatoire';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'La description doit contenir au moins 10 caractères';
    }

    if (!formData.category) {
      errors.category = 'Veuillez sélectionner une catégorie';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitSuccess(false);
      
      const reportData = {
        description: formData.description.trim(),
        category: formData.category,
        severity: formData.severity,
        containerId: formData.containerId || null,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
      };

      // Ajouter la photo si elle existe
      if (photoPreview) {
        reportData.photo = photoPreview; // Image encodée en base64
      }

      await onSubmit(reportData);
      setSubmitSuccess(true);
      // Réinitialiser le formulaire
      setFormData({
        description: '',
        category: 'autre',
        severity: 'normal',
        containerId: containerId || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
      });
      // Réinitialiser la photo
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError(null);
      // Fermer le modal après 2 secondes
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>📋 Signaler un problème</h2>
          <button
            className="close-button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fermer le modal"
          >
            ✕
          </button>
        </div>

        {submitSuccess ? (
          <div className="report-success-message">
            <div className="success-icon">✓</div>
            <h3>Signalement enregistré</h3>
            <p>Merci de votre contribution! Votre signalement a été reçu et sera traité par notre équipe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            {/* Message d'erreur global */}
            {error && (
              <div className="error-message global-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Description du problème <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez le problème en détail (au minimum 10 caractères)..."
                className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
                disabled={isLoading}
                rows={4}
                maxLength={500}
              />
              {validationErrors.description && (
                <span className="field-error">{validationErrors.description}</span>
              )}
              <span className="char-count">
                {formData.description.length}/500
              </span>
            </div>

            {/* Catégorie */}
            <div className="form-group">
              <label htmlFor="category">
                Catégorie <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`form-select ${validationErrors.category ? 'error' : ''}`}
                disabled={isLoading}
              >
                <option value="autre">Autre</option>
                <option value="conteneur_plein">Conteneur plein</option>
                <option value="conteneur_casse">Conteneur cassé</option>
                <option value="conteneur_sale">Conteneur sale</option>
                <option value="localisation">Mauvaise localisation</option>
                <option value="conteneur_absent">Conteneur absent</option>
              </select>
              {validationErrors.category && (
                <span className="field-error">{validationErrors.category}</span>
              )}
            </div>

            {/* Sévérité */}
            <div className="form-group">
              <label htmlFor="severity">Niveau de sévérité</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="form-select"
                disabled={isLoading}
              >
                <option value="basse">Basse</option>
                <option value="normal">Normal</option>
                <option value="haute">Haute</option>
              </select>
            </div>

            {/* Sélection du conteneur */}
            {containers && containers.length > 0 && (
              <div className="form-group">
                <label htmlFor="containerId">
                  Conteneur concerné <span className="optional">(optionnel)</span>
                </label>
                <select
                  id="containerId"
                  name="containerId"
                  value={formData.containerId}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLoading}
                >
                  <option value="">-- Aucun conteneur sélectionné --</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.type} ({container.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
                <p className="field-hint">Sélectionnez le conteneur concerné si applicable</p>
              </div>
            )}

            {/* Upload de photo */}
            <div className="form-group">
              <label htmlFor="photo">
                📸 Photo <span className="optional">(optionnel)</span>
              </label>
              {!photoPreview ? (
                <div className="photo-upload-area">
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoChange}
                    disabled={isLoading}
                    className="photo-input"
                  />
                  <label htmlFor="photo" className="photo-upload-label">
                    <span className="upload-icon">📤</span>
                    <span className="upload-text">Cliquez ou glissez une image</span>
                    <span className="upload-hint">JPEG, PNG, WebP ou GIF (max 5MB)</span>
                  </label>
                </div>
              ) : (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Aperçu" className="photo-preview" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                  >
                    ✕ Supprimer
                  </button>
                </div>
              )}
              {photoError && (
                <span className="field-error">{photoError}</span>
              )}
            </div>

            {/* Informations de localisation */}
            <div className="form-group">
              <div className="location-header">
                <label className="location-label">
                  📍 Position GPS
                </label>
                {!editingPosition && location && (
                  <button
                    type="button"
                    className="edit-position-btn"
                    onClick={() => setEditingPosition(true)}
                    disabled={isLoading}
                  >
                    ✏️ Éditer
                  </button>
                )}
              </div>

              {editingPosition ? (
                <div className="position-edit-container">
                  <div className="position-input-row">
                    <div className="position-input">
                      <label htmlFor="latitude">Latitude</label>
                      <input
                        id="latitude"
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        step="0.0001"
                        placeholder="48.8566"
                        disabled={isLoading}
                        className="form-input-small"
                      />
                    </div>
                    <div className="position-input">
                      <label htmlFor="longitude">Longitude</label>
                      <input
                        id="longitude"
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        step="0.0001"
                        placeholder="2.3522"
                        disabled={isLoading}
                        className="form-input-small"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="validate-position-btn"
                    onClick={() => setEditingPosition(false)}
                    disabled={isLoading}
                  >
                    ✓ Valider
                  </button>
                </div>
              ) : (
                <div className="location-info">
                  {location ? (
                    <p className="location-coords">
                      {parseFloat(formData.latitude).toFixed(4)}°, {parseFloat(formData.longitude).toFixed(4)}°
                    </p>
                  ) : (
                    <p className="no-location">Aucune position disponible</p>
                  )}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="form-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Envoi...
                  </>
                ) : (
                  'Envoyer le signalement'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
