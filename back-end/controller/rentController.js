// controllers/rentController.js
const db = require("../db/connection");
// const dayjs = require("dayjs");
const moment = require("moment");
// Get all rent bills.
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

// Generate a new rent bill.
exports.generateBill = async (req, res) => {
  try {
    // Destructure required fields from request body.
    // Note: We now also accept original_due_date.
    const { tenant_id, bill_date, amount, due_date, original_due_date } = req.body;
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

    const tenantPaymentTerm = Number(tenantRows[0].payment_term) || 30;

    // If due_date is not provided, calculate it as bill_date + tenantPaymentTerm days.
    let finalDueDate = due_date;
    let finalOriginalDueDate = original_due_date;
    if (!due_date) {
      finalDueDate = dayjs(bill_date)
        .add(tenantPaymentTerm, "day")
        .format("YYYY-MM-DD");
      finalOriginalDueDate = finalDueDate;
    }

    const penalty = 0;
    const payment_status = "pending";

    // Insert the new bill, storing both due_date and original_due_date.
    const [result] = await db.query(
      `INSERT INTO monthly_rent_bills
        (tenant_id, bill_date, amount, penalty, payment_status, payment_term, due_date, original_due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id,
        bill_date,
        amount,
        penalty,
        payment_status,
        tenantPaymentTerm,
        finalDueDate,
        finalOriginalDueDate,
      ]
    );

    res.status(201).json({
      billId: result.insertId,
      tenant_id,
      bill_date,
      amount: parseFloat(amount),
      penalty,
      payment_status,
      payment_term: tenantPaymentTerm,
      due_date: finalDueDate,
      original_due_date: finalOriginalDueDate,
    });
  } catch (error) {
    console.error("Error generating bill:", error);
    res.status(500).json({ message: "Server error while generating bill." });
  }
};

// Submit a payment proof.
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

// Approve a payment.
exports.approvePayment = async (req, res) => {
  try {
    const billId = req.params.id;

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
      `SELECT id, due_date, amount, payment_status FROM monthly_rent_bills 
       WHERE payment_status NOT IN ('approved', 'paid')`
    );

    if (!bills || bills.length === 0) {
      return res.json({ message: "No unpaid bills found." });
    }

    const updates = [];
    // Use UTC and start the day so that we compare whole days only.
    const currentDate = moment.utc().startOf("day");

    for (const bill of bills) {
      // Parse due_date in UTC. This helps if the due_date is stored as an ISO string.
      const dueDate = moment.utc(bill.due_date).startOf("day");

      if (currentDate.isAfter(dueDate)) {
        // Calculate whole days overdue.
        const daysOverdue = currentDate.diff(dueDate, "days");
        const dailyPenaltyRate = 0.01;
        const newPenalty = parseFloat(bill.amount) * dailyPenaltyRate * daysOverdue;

        console.log(
          `Bill ${bill.id} is overdue by ${daysOverdue} day(s). New penalty: ${newPenalty}`
        );

        updates.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
            [newPenalty, bill.id]
          )
        );
      } else {
        updates.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
            [0, bill.id]
          )
        );
      }
    }

    await Promise.all(updates);

    res.json({
      message: "Overdue bills updated with continuous penalty accrual.",
    });
  } catch (error) {
    console.error("Error updating overdue bills:", error);
    res
      .status(500)
      .json({ message: "Server error while updating overdue bills." });
  }
};
// Get a single rent bill by ID.
exports.getBillById = async (req, res) => {
  try {
    const billId = req.params.id;
    const [rows] = await db.query(
      "SELECT * FROM monthly_rent_bills WHERE id = ?",
      [billId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: "Bill not found." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching bill details." });
  }
};
