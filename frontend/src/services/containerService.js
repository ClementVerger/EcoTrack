// src/services/containerService.js
import api from "./api";

/**
 * Récupère tous les conteneurs
 */
export const getAllContainers = async () => {
  try {
    const response = await api.get("/containers");
    return response.data.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des conteneurs:", error);
    throw error;
  }
};

/**
 * Récupère un conteneur par ID
 */
export const getContainerById = async (id) => {
  try {
    const response = await api.get(`/containers/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du conteneur ${id}:`, error);
    throw error;
  }
};

/**
 * Récupère les conteneurs d'un type spécifique
 */
export const getContainersByType = async (type) => {
  try {
    const response = await api.get(`/containers/type/${type}`);
    return response.data.data;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des conteneurs de type ${type}:`,
      error,
    );
    throw error;
  }
};

/**
 * Récupère les conteneurs d'un statut spécifique
 */
export const getContainersByStatus = async (status) => {
  try {
    const response = await api.get(`/containers/status/${status}`);
    return response.data.data;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des conteneurs avec le statut ${status}:`,
      error,
    );
    throw error;
  }
};
