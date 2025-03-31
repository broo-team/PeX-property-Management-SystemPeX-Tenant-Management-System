// routes/maintenance.js
const express = require('express');
const router = express.Router();
const maintenanceController = require('../controller/maintenanceController');

// Create a new maintenance request
router.post('/', maintenanceController.createMaintenanceRequest);

// Retrieve maintenance requests (with optional filters)
router.get('/', maintenanceController.getMaintenanceRequests);

// Update a maintenance request based on an action type
router.put('/:id', maintenanceController.updateMaintenanceRequest);

// Delete a maintenance request
router.delete('/:id', maintenanceController.deleteMaintenanceRequest);

module.exports = router;
