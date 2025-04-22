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

    // Retrieve payment_term and rent_end_date from tenants table.
    const [tenantRows] = await db.query(
      `SELECT payment_term, rent_end_date FROM tenants WHERE id = ?`,
      [tenant_id]
    );

    if (tenantRows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    // Use tenant's rent_end_date as the due date for payment.
    // This means that penalty will only accrue once that date is passed.
    const rentEndDate = new Date(tenantRows[0].rent_end_date);
    const dueDateString = rentEndDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // When a bill is generated, penalty is set to zero;
    // the penalty will only be updated if rent_end_date is exceeded.
    const penalty = 0;
    const payment_status = "pending";

    const [result] = await db.query(
      `INSERT INTO monthly_rent_bills
        (tenant_id, bill_date, amount, penalty, payment_status, payment_term, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant_id, bill_date, amount, penalty, payment_status, tenantRows[0].payment_term, dueDateString]
    );

    res.status(201).json({
      billId: result.insertId,
      tenant_id,
      bill_date,
      amount: parseFloat(amount),
      penalty,
      payment_status,
      payment_term: tenantRows[0].payment_term,
      due_date: dueDateString,
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

// Approve the payment showing that a proof has been submitted
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

// Update overdue bills with penalty calculation
// This logic now recalculates the penalty only once the current date is past the due_date
// (which equals the tenant's rent_end_date).
// Update overdue bills with penalty calculation.
// Penalty will continue accruing on bills that are unpaid until the payment is approved (or marked as paid).
exports.updateOverdueBills = async (req, res) => {
    try {
        const [bills] = await db.query(
            `SELECT id, due_date, amount, payment_status FROM monthly_rent_bills 
             WHERE payment_status NOT IN ('approved', 'paid')`
        );

        if (!bills || bills.length === 0) {
            return res.json({ message: "No unpaid bills found." });
        }

        const updates = [];
        const currentDate = new Date();

        for (const bill of bills) {
            const dueDate = new Date(bill.due_date);

            if (currentDate > dueDate) {
                const daysOverdue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
                const dailyPenaltyRate = 0.01;
                const newPenalty = bill.amount * dailyPenaltyRate * daysOverdue;

                updates.push(db.query(
                    `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
                    [newPenalty, bill.id]
                ));
            } else {
                updates.push(db.query(
                    `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
                    [0, bill.id]
                ));
            }
        }

        await Promise.all(updates); // Execute all updates concurrently

        res.json({ message: "Overdue bills updated with continuous penalty accrual." });
    } catch (error) {
        console.error("Error updating overdue bills:", error);
        res.status(500).json({ message: "Server error while updating overdue bills." });
    }
};
// Get a single rent bill by ID
exports.getBillById = async (req, res) => {
  try {
    const billId = req.params.id;
    const [rows] = await db.query(
      "SELECT * FROM monthly_rent_bills WHERE id = ?",
      [billId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    res.status(500).json({ message: "Server error while fetching bill details." });
  }
};
