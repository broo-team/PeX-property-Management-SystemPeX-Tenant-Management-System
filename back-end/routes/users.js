const express = require("express");
const router = express.Router();
const { createUser,getUsers } = require("../controller/userController");
// const {authenticateUser} = require("../middleware/authUser")

// POST /api/users - Create a new sub‑user (protected)
router.post("/", createUser);
router.get("/", getUsers)

module.exports = router;