const express = require('express');
const router = express.Router();
const buildingController = require('../controller/buildingController');

router.get('/', buildingController.getBuildings);
router.put('/:id', buildingController.updateBuilding);
router.put('/suspend/:id', buildingController.suspendBuilding);
router.get('/:id', buildingController.getBuildingById);
router.post('/', buildingController.createBuilding);

module.exports = router
