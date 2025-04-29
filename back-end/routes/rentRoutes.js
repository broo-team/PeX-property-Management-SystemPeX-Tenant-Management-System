const express = require("express");
const router = express.Router();
const rentController = require("../controller/rentController");
const multer = require("multer"); // Import multer

// Configure multer for file uploads
// You can customize destination and filename as needed
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Set a unique filename
  },
});

const upload = multer({ storage: storage }); // Initialize multer with storage options


// Get all rent bills
router.get("/", rentController.getBills);

// Generate a new rent bill
router.post("/generate", rentController.generateBill);

// Update overdue bills (e.g. auto-update penalty for bills overdue by 60+ days)
router.patch("/updateOverdue", rentController.updateOverdueBills);

// Submit a payment proof for a given bill by its ID
// Use the 'upload.single()' middleware to handle a single file upload
router.patch("/:id/proof", upload.single("paymentProof"), rentController.submitPaymentProof); // 'paymentProof' is the name of the file input field

// Approve a payment for a given bill by its ID
router.patch("/:id/approve", rentController.approvePayment);

// Get a single rent bill
router.get("/:id", rentController.getBillById);

module.exports = router;