// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import the change building password controller
const userControllers = require('../user/changePassword'); 

// Define the route for changing a building's password
// We'll use a PUT request for updating a resource (the password)
// The ':id' parameter captures the building ID from the URL
router.put('/buildings/:id/change-password', userControllers.changeBuildingPassword);

// You would export the router to be used in your main app file
module.exports = router;

// Add other user-related routes here if you have them, e.g.:
// router.post('/register', userControllers.registerUser);
// router.post('/login', userControllers.loginUser);