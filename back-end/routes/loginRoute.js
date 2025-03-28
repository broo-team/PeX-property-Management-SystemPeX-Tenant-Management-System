const express = require('express');
const router = express.Router();
const buildingController = require('../controller/buildingController');
const authMiddleware  = require('../middleware/authMiddleware');

const {login} = require("../controller/authController")

router.post('/login',login);

module.exports = router