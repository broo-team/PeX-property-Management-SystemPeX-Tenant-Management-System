// routes/buildings.js
const express = require('express');
const router = express.Router();
const buildingController = require('../controller/buildingController');

router.get('/', buildingController.getBuildings);
router.put('/:id', buildingController.updateBuilding);

// Existing suspend route
router.put('/suspend/:id', buildingController.suspendBuilding);

// New route for activating with dates
router.patch('/:id/activate', buildingController.activateBuildingWithDates); // <--- Added this line

router.get('/:id', buildingController.getBuildingById);
router.post('/', buildingController.createBuilding);

// NOTE: You might want to add a DELETE route here as well,
// although the frontend now uses Suspend instead of Delete.
// router.delete('/:id', buildingController.deleteBuilding);

module.exports = router;