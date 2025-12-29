// src/services/reportService.js
import axios from "axios";
import { getEnv } from "../utils/env.js";

const API_BASE_URL =
  getEnv("VITE_REACT_APP_API_BASE_URL") ||
  getEnv("VITE_API_BASE_URL") ||
  "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Créer un nouveau signalement
 * @param {Object} reportData
 * @param {string} reportData.containerId - ID du conteneur
 * @param {number} reportData.latitude - Latitude
 * @param {number} reportData.longitude - Longitude
 * @returns {Promise<Object>} Rapport créé
 */
export const createReport = async (reportData) => {
  const response = await apiClient.post("/reports", reportData);
  return response.data.data;
};

/**
 * Récupérer tous les signalements
 * @param {Object} options
 * @param {string} options.status - Filtre par statut (optional)
 * @returns {Promise<Array>} Liste des rapports
 */
export const getAllReports = async (options = {}) => {
  const response = await apiClient.get("/reports", { params: options });
  return response.data.data.reports;
};

/**
 * Récupérer les signalements de l'utilisateur connecté
 * @returns {Promise<Array>} Liste des rapports de l'utilisateur
 */
export const getMyReports = async () => {
  const response = await apiClient.get("/reports/me");
  return response.data.data.reports;
};

/**
 * Récupérer un signalement par son ID
 * @param {string} reportId - ID du rapport
 * @returns {Promise<Object>} Détails du rapport
 */
export const getReportById = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data.data;
};

/**
 * Valider un signalement (Admin uniquement)
 * @param {string} reportId - ID du rapport
 * @returns {Promise<Object>} Rapport validé
 */
export const validateReport = async (reportId) => {
  const response = await apiClient.put(`/reports/${reportId}/validate`);
  return response.data.data;
};

/**
 * Rejeter un signalement (Admin uniquement)
 * @param {string} reportId - ID du rapport
 * @returns {Promise<Object>} Rapport rejeté
 */
export const rejectReport = async (reportId) => {
  const response = await apiClient.put(`/reports/${reportId}/reject`);
  return response.data.data;
};

export default {
  createReport,
  getAllReports,
  getMyReports,
  getReportById,
  validateReport,
  rejectReport,
};
