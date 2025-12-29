// src/utils/distance.js

/**
 * Calcule la distance entre deux points GPS en mètres
 * Utilise la formule de Haversine
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} Distance en mètres
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180; // Convertir en radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
};

/**
 * Filtre les conteneurs selon les critères spécifiés
 * @param {Array} containers - Liste des conteneurs
 * @param {Object} filters - Objet de filtres { types, status, distance }
 * @param {Object} userPosition - Position de l'utilisateur { latitude, longitude }
 * @returns {Array} Conteneurs filtrés
 */
export const filterContainers = (containers, filters, userPosition) => {
  return containers.filter((container) => {
    // Filtre par type
    if (filters.types.length > 0 && !filters.types.includes(container.type)) {
      return false;
    }

    // Filtre par statut
    if (
      filters.status.length > 0 &&
      !filters.status.includes(container.status)
    ) {
      return false;
    }

    // Filtre par distance
    if (filters.distance > 0 && userPosition) {
      const distance = calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        container.latitude,
        container.longitude,
      );

      if (distance > filters.distance) {
        return false;
      }
    }

    return true;
  });
};

export default {
  calculateDistance,
  filterContainers,
};
