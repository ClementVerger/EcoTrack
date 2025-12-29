// src/components/Map/Map.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/Map.css";
import { getAllContainers } from "../../services/containerService";
import { geocodeAddress } from "../../services/geocodingService";
import { useGeolocation } from "../../hooks/useGeolocation";
import { filterContainers } from "../../utils/distance";
import ContainerDetailPanel from "./ContainerDetailPanel";
import FilterBar from "./FilterBar";

// Marqueur utilisateur
const UserLocationMarker = ({ position }) => {
  if (!position) return null;

  const userIcon = L.divIcon({
    html: `<div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2196F3;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #2196F3, 0 0 12px rgba(33, 150, 243, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>`,
    className: "user-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={[position.latitude, position.longitude]} icon={userIcon}>
      <Popup className="user-location-popup">
        <div className="popup-content">
          <h4>📍 Votre position</h4>
          <p className="location-coords">
            {position.latitude.toFixed(4)}°, {position.longitude.toFixed(4)}°
          </p>
          <p className="location-accuracy">
            Précision: ±{Math.round(position.accuracy)}m
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

// Composant pour centrer la carte sur l'utilisateur
const MapCenterController = ({ userPosition, searchPosition }) => {
  const map = useMap();

  useEffect(() => {
    const positionToUse = searchPosition || userPosition;
    if (positionToUse) {
      map.setView([positionToUse.latitude, positionToUse.longitude], 14, {
        animate: true,
        duration: 1,
      });
    }
  }, [userPosition, searchPosition, map]);

  return null;
};

// Icônes personnalisées pour chaque type de conteneur (responsive)
const createContainerIcon = (type, isMobile) => {
  const colors = {
    Verre: "#2196F3", // Bleu
    Papier: "#FF9800", // Orange
    Plastique: "#4CAF50", // Vert
    Ordures: "#9C27B0", // Violet
  };

  const color = colors[type] || "#808080";
  const size = isMobile ? 28 : 32;
  const fontSize = isMobile ? 12 : 14;

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <span style="
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
      ">${type.charAt(0)}</span>
    </div>`,
    className: "container-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  });
};

const getStatusLabel = (status) => {
  const labels = {
    vide: "🟢 Vide",
    presque_plein: "🟡 Presque plein",
    plein: "🔴 Plein",
    hors_service: "⚫ Hors service",
  };
  return labels[status] || status;
};

export default function Map() {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [filters, setFilters] = useState({
    types: [],
    status: [],
    distance: 0,
  });
  const searchInputRef = useRef(null);

  const {
    position: userPosition,
    error: geoError,
    loading: geoLoading,
  } = useGeolocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        setLoading(true);
        const data = await getAllContainers();
        setContainers(data);
      } catch (err) {
        setError("Erreur lors du chargement des conteneurs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchError("Veuillez entrer une adresse");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setSearchResults([]);

      const results = await geocodeAddress(searchQuery);
      setSearchResults(results);

      if (results.length > 0) {
        setSelectedSearchResult(results[0]);
      }
    } catch (err) {
      setSearchError(err.message || "Erreur lors de la recherche");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectResult = (result) => {
    setSelectedSearchResult(result);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleMarkerClick = (container) => {
    setSelectedContainer(container);
  };

  const handleClosePanel = () => {
    setSelectedContainer(null);
  };

  const handleReportContainer = async (container) => {
    // Naviguer vers la page de rapport avec le container ID pré-rempli
    navigate(`/reports?containerId=${container.id}&type=${container.type}`);
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  // Centre de la carte par défaut (Paris)
  const defaultCenter = [48.8566, 2.3522];
  const defaultZoom = isMobile ? 11 : 12;

  // Position à afficher (utilisateur > recherche > défaut)
  const centerPosition = selectedSearchResult ||
    userPosition || { latitude: defaultCenter[0], longitude: defaultCenter[1] };

  // Appliquer les filtres
  const filteredContainers = filterContainers(
    containers,
    filters,
    userPosition,
  );

  return (
    <>
      <div className="map-wrapper">
        {/* Écran de chargement */}
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Chargement de la carte...</p>
            </div>
          </div>
        )}

        {/* Écran d'erreur - Conteneurs */}
        {error && !loading && (
          <div className="map-error">
            <div className="error-container">
              <h2>❌ Erreur de chargement</h2>
              <p>{error}</p>
              <button
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                🔄 Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Carte et contenu - visible que si pas d'erreur critique */}
        {!error && (
          <>
            {/* Barre de filtres */}
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              userPosition={userPosition}
              isMobileOpen={filterPanelOpen}
              onMobileOpenChange={setFilterPanelOpen}
            />

            {/* Barre de recherche */}
            {geoError && (
              <div className="search-bar-container">
                <form onSubmit={handleSearch} className="search-bar">
                  <div className="search-input-wrapper">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="🔍 Chercher une localisation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    <button
                      type="submit"
                      className="search-button"
                      disabled={searchLoading}
                    >
                      {searchLoading ? "⏳" : "🔍"}
                    </button>
                  </div>

                  {/* Message d'erreur GPS */}
                  {geoError && (
                    <div className="geo-error-message">
                      <span>📍 {geoError}</span>
                    </div>
                  )}

                  {/* Résultats de recherche */}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="search-result-item"
                          onClick={() => handleSelectResult(result)}
                        >
                          <span className="result-name">{result.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchError && (
                    <div className="search-error-message">⚠️ {searchError}</div>
                  )}
                </form>
              </div>
            )}

            {/* Carte */}
            <MapContainer
              center={[centerPosition.latitude, centerPosition.longitude]}
              zoom={defaultZoom}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ZoomControl position={isMobile ? "topright" : "bottomright"} />

              {/* Marqueur utilisateur */}
              <UserLocationMarker
                position={userPosition || selectedSearchResult}
              />

              {/* Contrôleur du centre de la carte */}
              <MapCenterController
                userPosition={userPosition}
                searchPosition={selectedSearchResult}
              />

              {/* Conteneurs */}
              {filteredContainers.map((container) => (
                <Marker
                  key={container.id}
                  position={[container.latitude, container.longitude]}
                  icon={createContainerIcon(container.type, isMobile)}
                  eventHandlers={{
                    click: () => handleMarkerClick(container),
                  }}
                >
                  <Popup className="container-popup">
                    <div className="popup-content">
                      <h4>{container.type}</h4>
                      <div className="popup-divider"></div>
                      <div className="popup-info">
                        <p>
                          <span className="info-label">ID:</span>
                          <span className="info-value">
                            {container.id.substring(0, 8)}...
                          </span>
                        </p>
                        <p>
                          <span className="info-label">Statut:</span>
                          <span className="info-value">
                            {getStatusLabel(container.status)}
                          </span>
                        </p>
                        <p>
                          <span className="info-label">Remplissage:</span>
                          <span className="info-value">
                            {container.fillLevel}%
                          </span>
                        </p>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${container.fillLevel}%`,
                              backgroundColor:
                                container.fillLevel < 50
                                  ? "#4CAF50"
                                  : container.fillLevel < 80
                                    ? "#FF9800"
                                    : "#F44336",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Info Box */}
            <div className="map-info">
              <div className="info-content">
                <span className="info-count">{containers.length}</span>
                <span className="info-text">
                  conteneur{containers.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Indicateur de géolocalisation */}
            {geoLoading && (
              <div className="geo-loading-indicator">
                <span className="geo-spinner"></span>
                <span className="geo-text">Localisation...</span>
              </div>
            )}
          </>
        )}

        {/* Panneau de détails du conteneur */}
        {selectedContainer && (
          <ContainerDetailPanel
            container={selectedContainer}
            onClose={handleClosePanel}
            onReport={handleReportContainer}
          />
        )}
      </div>

      {/* Bouton hamburger + Compteur en bas à gauche */}
      <div className="bottom-bar">
        <button
          className="hamburger-btn"
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          title="Ouvrir les filtres"
        >
          ☰
        </button>
        <div className="container-counter">
          <span className="counter-label">Conteneurs:</span>
          <span className="counter-value">
            {filteredContainers.length}/{containers.length}
          </span>
        </div>
      </div>
    </>
  );
}
