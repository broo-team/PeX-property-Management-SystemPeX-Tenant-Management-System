const express = require('express');
const router = express.Router();
const buildingController = require('../controller/buildingController');
const multer = require('multer');
const path = require('path');

// --- Multer Configuration ---

// Set up storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/buildings/'); // Make sure this folder exists or create it
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter to allow only image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and JPG images are allowed.'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- Routes ---

// GET all buildings
router.get('/', buildingController.getBuildings);

// GET single building by ID
router.get('/:id', buildingController.getBuildingById);

// POST new building (with image upload)
router.post('/', upload.single('buildingImage'), buildingController.createBuilding);

// PUT update building
router.put('/:id', buildingController.updateBuilding);

// PUT suspend building
router.put('/suspend/:id', buildingController.suspendBuilding);

// PATCH activate building with date
router.patch('/:id/activate', buildingController.activateBuildingWithDates);

// POST reset owner password
router.post('/:id/reset-password', buildingController.resetOwnerPassword);

// Export router
module.exports = router;
