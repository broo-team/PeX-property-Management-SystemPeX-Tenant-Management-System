// controllers/rentController.js
const db = require("../db/connection");

// Get all rent bills
exports.getBills = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM monthly_rent_bills ORDER BY created_at DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching bills:", error);
        res.status(500).json({ message: "Server error while fetching bills." });
    }
};

// Generate a new rent bill
exports.generateBill = async (req, res) => {
    try {
        const { tenant_id, bill_date, amount } = req.body;
        if (!tenant_id || !bill_date || !amount) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Retrieve payment_term from tenants table
        const [tenantRows] = await db.query(
            `SELECT payment_term FROM tenants WHERE id = ?`,
            [tenant_id]
        );

        if (tenantRows.length === 0) {
            return res.status(404).json({ message: "Tenant not found." });
        }

        const payment_term = tenantRows[0].payment_term;

        const penaltyRate = 0.01;
        const penalty = parseFloat(amount) * penaltyRate;
        const payment_status = "pending";

        const [result] = await db.query(
            `INSERT INTO monthly_rent_bills
            (tenant_id, bill_date, amount, penalty, payment_status, payment_term)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [tenant_id, bill_date, amount, penalty, payment_status, payment_term]
        );

        res.status(201).json({
            billId: result.insertId,
            tenant_id,
            bill_date,
            amount: parseFloat(amount),
            penalty,
            payment_status,
            payment_term,
        });
    } catch (error) {
        console.error("Error generating bill:", error);
        res.status(500).json({ message: "Server error while generating bill." });
    }
};

// Submit a payment proof (by updating the bill record)
exports.submitPaymentProof = async (req, res) => {
    try {
        const billId = req.params.id;
        const { proof_url } = req.body;

        if (!proof_url || proof_url.trim() === "") {
            return res
                .status(400)
                .json({ message: "Proof URL is required for submission." });
        }

        const [result] = await db.query(
            `UPDATE monthly_rent_bills 
                SET payment_proof_url = ?, payment_status = 'submitted'
                WHERE id = ?`,
            [proof_url, billId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Bill not found." });
        }

        res.json({
            message: "Payment proof submitted successfully.",
            billId,
        });
    } catch (error) {
        console.error("Error submitting payment proof:", error);
        res
            .status(500)
            .json({ message: "Server error while submitting payment proof." });
    }
};

// Approve the payment showing that proof has been submitted
exports.approvePayment = async (req, res) => {
    try {
        const billId = req.params.id;

        // Update only if payment status is 'submitted'
        const [result] = await db.query(
            `UPDATE monthly_rent_bills 
                SET payment_status = 'approved' 
                WHERE id = ? AND payment_status = 'submitted'`,
            [billId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Bill not found or payment has not been submitted yet.",
            });
        }

        res.json({
            message: "Payment approved successfully.",
            billId,
        });
    } catch (error) {
        console.error("Error approving payment:", error);
        res
            .status(500)
            .json({ message: "Server error while approving payment." });
    }
};

exports.updateOverdueBills = async (req, res) => {
    try {
        const [bills] = await db.query(
            `SELECT id, bill_date, payment_term, amount, penalty, payment_status FROM monthly_rent_bills WHERE payment_status != 'paid'`
        );

        for (const bill of bills) {
            const billDate = new Date(bill.bill_date);
            const currentDate = new Date();
            const daysSinceBill = Math.floor((currentDate - billDate) / (1000 * 60 * 60 * 24));
            const daysOverdue = Math.max(0, daysSinceBill - bill.payment_term);

            console.log(`Bill ID: ${bill.id}, Bill Date: ${billDate}, Payment Term: ${bill.payment_term}, Days Overdue: ${daysOverdue}`);

            if (daysOverdue > 0) {
                const dailyPenaltyRate = 0.01;
                const dailyPenalty = bill.amount * dailyPenaltyRate;
                const newPenalty = bill.penalty + (dailyPenalty * daysOverdue);

                console.log(`Daily Penalty: ${dailyPenalty}, New Penalty: ${newPenalty}`);

                await db.query(
                    `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
                    [newPenalty, bill.id]
                );
            }
        }

        res.json({ message: "Overdue bills updated with daily penalty." });
    } catch (error) {
        console.error("Error updating overdue bills:", error);
        res.status(500).json({ message: "Server error while updating overdue bills." });
    }
};


// Get a single rent bill by ID
exports.getBillById = async (req, res) => {
  try {
    const billId = req.params.id;
    const [rows] = await db.query("SELECT * FROM monthly_rent_bills WHERE id = ?", [billId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    res.status(500).json({ message: "Server error while fetching bill details." });
  }
};
