// src/hooks/useGeolocation.js
import { useState, useEffect } from "react";

/**
 * Hook pour récupérer la position GPS de l'utilisateur
 * @returns {Object} { position, error, loading, refetch }
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGeolocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur votre navigateur");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        let errorMessage = "Erreur lors de la récupération de la position";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Permission de géolocalisation refusée. Vous pouvez l'activer dans les paramètres du navigateur.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Votre position n'a pas pu être déterminée. Essayez à nouveau ou utilisez la recherche manuelle.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "La demande de géolocalisation a dépassé le délai imparti.";
            break;
          default:
            errorMessage =
              "Une erreur est survenue lors de la récupération de votre position.";
        }

        setError(errorMessage);
        setPosition(null);
        setLoading(false);
      },
      {
        timeout: 10000, // 10 secondes
        enableHighAccuracy: false, // False pour une meilleure performance sur mobile
        maximumAge: 300000, // Utiliser un cache de 5 minutes
      },
    );
  };

  useEffect(() => {
    fetchGeolocation();
  }, []);

  return {
    position,
    error,
    loading,
    refetch: fetchGeolocation,
  };
}
