// routes/creatorRoutes.js
// This file defines the specific routes for creator-related actions.
// Assuming this file is located within a 'routes' directory.

const express = require('express');
const router = express.Router();
const creatorController = require('../controller/sass/creatorController'); // Adjust path based on your structure
const authMiddleware = require('../middleware/authsaas'); // Adjust path based on your structure

// Public routes
router.post('/register', creatorController.register);
router.post('/login', creatorController.login);

// Protected routes - require authentication middleware
// Apply authMiddleware to routes that need user to be logged in
router.get('/me', authMiddleware, creatorController.getMe);

// Define the specific change-password route BEFORE the general :id route
router.put('/change-password', authMiddleware, creatorController.changePassword); // <-- Move this UP

// Define the general :id routes AFTER specific ones
router.get('/:id', authMiddleware, creatorController.getCreator);
router.put('/:id', authMiddleware, creatorController.updateCreator); // <-- This must be AFTER /change-password
router.delete('/:id', authMiddleware, creatorController.deleteCreator);
module.exports = router;
