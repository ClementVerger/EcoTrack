// src/routes/container.routes.js
const express = require('express');
const containerController = require('../controllers/container.controller');

const router = express.Router();

// Routes publiques pour afficher les conteneurs sur la carte
router.get('/', containerController.getAllContainers);
router.get('/:id', containerController.getContainerById);
router.get('/type/:type', containerController.getContainersByType);
router.get('/status/:status', containerController.getContainersByStatus);

module.exports = router;
