// src/controllers/container.controller.js
const { Container } = require('../models');

/**
 * Récupère tous les conteneurs avec leurs informations
 * GET /api/containers
 */
exports.getAllContainers = async (req, res, next) => {
  try {
    const containers = await Container.findAll({
      attributes: ['id', 'type', 'latitude', 'longitude', 'status', 'fillLevel', 'capacity'],
    });

    res.json({
      success: true,
      data: containers,
      count: containers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un conteneur spécifique par ID
 * GET /api/containers/:id
 */
exports.getContainerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const container = await Container.findByPk(id);

    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Conteneur non trouvé',
      });
    }

    res.json({
      success: true,
      data: container,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les conteneurs filtrés par type
 * GET /api/containers/type/:type
 */
exports.getContainersByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const validTypes = ['Verre', 'Papier', 'Plastique', 'Ordures'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type invalide. Doit être l'un de: ${validTypes.join(', ')}`,
      });
    }

    const containers = await Container.findAll({
      where: { type },
      attributes: ['id', 'type', 'latitude', 'longitude', 'status', 'fillLevel', 'capacity'],
    });

    res.json({
      success: true,
      data: containers,
      count: containers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les conteneurs filtrés par statut
 * GET /api/containers/status/:status
 */
exports.getContainersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const validStatuses = ['vide', 'presque_plein', 'plein', 'hors_service'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Doit être l'un de: ${validStatuses.join(', ')}`,
      });
    }

    const containers = await Container.findAll({
      where: { status },
      attributes: ['id', 'type', 'latitude', 'longitude', 'status', 'fillLevel', 'capacity'],
    });

    res.json({
      success: true,
      data: containers,
      count: containers.length,
    });
  } catch (error) {
    next(error);
  }
};
