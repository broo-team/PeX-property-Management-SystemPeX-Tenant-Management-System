const express = require('express');
const router = express.Router();
const buildingController = require('../controller/buildingController');
const authMiddleware  = require('../middleware/authMiddleware');
const {login} = require("../controller/authController")

// router.post('/login', authMiddleware.login, (req, res) => {
//     res.json({
//       message: 'Login successful.',
//       owner: req.owner,
      
//     });
//   });


// router.get('/', buildingController.getBuildings);
// router.put('/:id', buildingController.updateBuilding);
// router.put('/suspend/:id', buildingController.suspendBuilding);
// router.get('/:id', buildingController.getBuildingById);
// router.post('/', buildingController.createBuilding);

  
module.exports = router;
