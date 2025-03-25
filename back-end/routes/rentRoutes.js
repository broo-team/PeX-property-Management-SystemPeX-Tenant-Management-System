const express = require("express");
const router = express.Router();
const rentController = require("../controller/rentController");

// Get all rent bills
router.get("/", rentController.getBills);

// Generate a new rent bill
router.post("/generate", rentController.generateBill);

// Update overdue bills (e.g. auto-update penalty for bills overdue by 60+ days)
router.patch("/updateOverdue", rentController.updateOverdueBills);

// Submit a payment proof for a given bill by its ID
router.patch("/:id/proof", rentController.submitPaymentProof);

// Approve a payment for a given bill by its ID
router.patch("/:id/approve", rentController.approvePayment);

// Get a single rent bill
router.get("/:id", rentController.getBillById);

module.exports = router;