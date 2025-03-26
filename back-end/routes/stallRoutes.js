// const express = require('express');
// const router = express.Router();
// const stallController = require('../controller/stallController');

// router.get('/', stallController.getStalls);
// router.post('/', stallController.createStall);
// router.post('/:stallCode/details', stallController.updateStallDetails);
// router.delete('/:stallCode', stallController.deleteStall);


// router.post('/:stallCode/rooms', stallController.createRoom);
// router.get('/:stallCode/rooms', stallController.getRooms)



const express = require('express');
const router = express.Router();
const stallController = require('../controller/stallController');

// Stall endpoints
router.get('/', stallController.getStalls);
router.post('/', stallController.createStall);
router.put('/:stallId', stallController.updateStallDetails);
router.delete('/:stallId', stallController.deleteStall);

// Room endpoints (using stallId as the parent identifier)
router.post('/:stallId/rooms', stallController.createRoom);
router.get('/:stallId/rooms', stallController.getRooms);
router.get('/getRooms',stallController.getRooms)
router.put('/rooms/:roomId', stallController.updateRoom);
router.put('/:stallId/rooms/:roomId', stallController.updateRoom);
module.exports = router;