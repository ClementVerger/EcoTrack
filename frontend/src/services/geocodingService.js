// src/services/geocodingService.js
import axios from "axios";

/**
 * Service de géocodage pour convertir une adresse en coordonnées GPS
 * Utilise Nominatim (OpenStreetMap) - Gratuit et sans clé API
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Recherche les coordonnées GPS pour une adresse donnée
 * @param {string} query - L'adresse ou le nom du lieu à rechercher
 * @returns {Promise<Array>} Tableau des résultats trouvés
 */
export const geocodeAddress = async (query) => {
  try {
    if (!query || query.trim() === "") {
      throw new Error("Veuillez entrer une adresse");
    }

    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: "json",
        limit: 5,
        countrycodes: "fr", // Restreindre à la France
      },
      headers: {
        Accept: "application/json",
      },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Aucun résultat trouvé pour cette recherche");
    }

    return response.data.map((result) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      name: result.display_name,
      type: result.type,
      address: result.address,
    }));
  } catch (error) {
    console.error("Erreur de géocodage:", error);
    if (
      error.message === "Aucun résultat trouvé pour cette recherche" ||
      error.message === "Veuillez entrer une adresse"
    ) {
      throw error;
    }
    throw new Error("Erreur lors de la recherche de localisation");
  }
};

/**
 * Inverse géocodage - Récupère l'adresse à partir des coordonnées
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} L'adresse trouvée
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
        },
        headers: {
          Accept: "application/json",
        },
        timeout: 10000,
      },
    );

    return (
      response.data.address?.road ||
      response.data.display_name ||
      "Localisation"
    );
  } catch (error) {
    console.error("Erreur de géocodage inverse:", error);
    return "Localisation";
  }
};
