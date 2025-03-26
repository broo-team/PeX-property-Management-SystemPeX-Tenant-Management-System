// controllers/rentController.js
const db = require("../db/connection");
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
    // Destructure required fields.
    const { tenant_id, bill_date, amount, due_date, original_due_date } = req.body;
    if (!tenant_id || !bill_date || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Retrieve tenant info.
    const [tenantRows] = await db.query(
      `SELECT payment_term, rent_end_date FROM tenants WHERE id = ?`,
      [tenant_id]
    );
    if (tenantRows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    const tenantPaymentTerm = Number(tenantRows[0].payment_term) || 30;

    // If due_date is not provided, compute it as bill_date + tenantPaymentTerm days,
    // and set it to the very end of that day.
    let finalDueDate = due_date;
    let finalOriginalDueDate = original_due_date;
    if (!due_date) {
      finalDueDate = moment(bill_date)
        .add(tenantPaymentTerm, "days")
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
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
      return res.status(400).json({ message: "Proof URL is required for submission." });
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
    res.status(500).json({ message: "Server error while submitting payment proof." });
  }
};

// Approve a payment with early payment credit handling.
exports.approvePayment = async (req, res) => {
  try {
    const billId = req.params.id;

    // Retrieve the current bill info.
    const [billRows] = await db.query(
      "SELECT due_date, original_due_date, payment_term FROM monthly_rent_bills WHERE id = ?",
      [billId]
    );
    if (billRows.length === 0) {
      return res.status(404).json({ message: "Bill not found." });
    }

    const { due_date, payment_term } = billRows[0];
    const now = moment();
    const dueDateMoment = moment(due_date, "YYYY-MM-DD HH:mm:ss");

    let newCycle; // the number of days to add for the new cycle

    if (now.isBefore(dueDateMoment)) {
      // Early payment: tenant pays before the due date.
      // Calculate the remaining days until the original due date.
      const remainingDays = dueDateMoment.diff(now, "days");
      // The new cycle equals the full payment term plus the remaining days.
      newCycle = payment_term + remainingDays;
    } else {
      // On-time or late payment.
      const overdueDays = now.diff(dueDateMoment, "days");
      newCycle = payment_term - overdueDays;
      // Safety: do not allow negative cycle length.
      if (newCycle < 0) newCycle = 0;
    }

    const newBillDate = now.format("YYYY-MM-DD");
    // New due date is now + newCycle days; using endOf("day") so that it lasts the full day.
    const newDueDate = now
      .clone()
      .add(newCycle, "days")
      .endOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    // Update the bill: mark the payment as paid and update cycle dates.
    const [result] = await db.query(
      `UPDATE monthly_rent_bills 
         SET payment_status = 'paid', 
             bill_date = ?, 
             due_date = ?, 
             original_due_date = ?
       WHERE id = ? AND payment_status = 'submitted'`,
      [newBillDate, newDueDate, newDueDate, billId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Bill not found or payment hasn't been submitted." });
    }

    res.json({
      message: "Payment approved successfully.",
      billId,
      newBillDate,
      newDueDate,
    });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ message: "Server error while approving payment." });
  }
};

// Update overdue bills with continuous penalty accrual and new month's rent.
// Update overdue bills with capped penalty accumulation.
// Once a new month begins (i.e. days overdue > payment_term),
// the penalty is capped to the penalty for a single term,
// while the new month's rent is added for each full cycle overdue.
exports.updateOverdueBills = async (req, res) => {
  try {
    const [bills] = await db.query(
      `SELECT id, due_date, amount, payment_status, payment_term, created_at 
       FROM monthly_rent_bills 
       WHERE payment_status NOT IN ('paid')`
    );

    if (!bills || bills.length === 0) {
      return res.json({ message: "No unpaid bills found." });
    }

    const updates = [];
    const currentDate = moment.utc().startOf("day");

    for (const bill of bills) {
      // Use the stored due_date as the base for accrual.
      const baseDueDate = moment.utc(bill.due_date).startOf("day");
      if (currentDate.isAfter(baseDueDate)) {
        const daysOverdue = currentDate.diff(baseDueDate, "days");
        const dailyPenaltyRate = 0.01;

        // Cap the overdue days used for penalty calculation to one payment term.
        const effectiveOverdueDays = Math.min(daysOverdue, bill.payment_term);
        const newPenalty = parseFloat(bill.amount) * dailyPenaltyRate * effectiveOverdueDays;

        // Calculate how many full cycles (months) have passed.
        const monthsOverdue = Math.floor(daysOverdue / bill.payment_term);

        // The new total due is computed as:
        //   (Original monthly rent * (1 + the number of full cycles overdue))
        //   plus the capped penalty.
        const newTotalDue = parseFloat(bill.amount) * (1 + monthsOverdue) + newPenalty;

        updates.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ?, totalDue = ? WHERE id = ?`,
            [newPenalty, newTotalDue, bill.id]
          )
        );
      } else {
        // Not overdue — reset penalty.
        updates.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ?, totalDue = amount WHERE id = ?`,
            [0, bill.id]
          )
        );
      }
    }

    await Promise.all(updates);
    res.json({
      message:
        "Overdue bills updated with capped penalty and new month's rent correctly factored in.",
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
    const [rows] = await db.query("SELECT * FROM monthly_rent_bills WHERE id = ?", [
      billId,
    ]);
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
// =======
// // controllers/rentController.js
// const db = require("../db/connection");
// const moment = require("moment");

// // Get all rent bills.
// exports.getBills = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT * FROM monthly_rent_bills ORDER BY created_at DESC"
//     );
//     res.json(rows);
//   } catch (error) {
//     console.error("Error fetching bills:", error);
//     res.status(500).json({ message: "Server error while fetching bills." });
//   }
// };

// // Generate a new rent bill.
// exports.generateBill = async (req, res) => {
//   try {
//     // Destructure required fields.
//     const { tenant_id, bill_date, amount, due_date, original_due_date } = req.body;
//     if (!tenant_id || !bill_date || !amount) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     // Retrieve tenant info.
//     const [tenantRows] = await db.query(
//       `SELECT payment_term, rent_end_date FROM tenants WHERE id = ?`,
//       [tenant_id]
//     );
//     if (tenantRows.length === 0) {
//       return res.status(404).json({ message: "Tenant not found." });
//     }
//     const tenantPaymentTerm = Number(tenantRows[0].payment_term) || 30;

//     // If due_date is not provided, compute it as bill_date + tenantPaymentTerm days,
//     // and set it to the very end of that day.
//     let finalDueDate = due_date;
//     let finalOriginalDueDate = original_due_date;
//     if (!due_date) {
//       finalDueDate = moment(bill_date)
//         .add(tenantPaymentTerm, "days")
//         .endOf("day")
//         .format("YYYY-MM-DD HH:mm:ss");
//       finalOriginalDueDate = finalDueDate;
//     }

//     const penalty = 0;
//     const payment_status = "pending";

//     // Insert the new bill, storing both due_date and original_due_date.
//     const [result] = await db.query(
//       `INSERT INTO monthly_rent_bills
//          (tenant_id, bill_date, amount, penalty, payment_status, payment_term, due_date, original_due_date)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         tenant_id,
//         bill_date,
//         amount,
//         penalty,
//         payment_status,
//         tenantPaymentTerm,
//         finalDueDate,
//         finalOriginalDueDate,
//       ]
//     );

//     res.status(201).json({
//       billId: result.insertId,
//       tenant_id,
//       bill_date,
//       amount: parseFloat(amount),
//       penalty,
//       payment_status,
//       payment_term: tenantPaymentTerm,
//       due_date: finalDueDate,
//       original_due_date: finalOriginalDueDate,
//     });
//   } catch (error) {
//     console.error("Error generating bill:", error);
//     res.status(500).json({ message: "Server error while generating bill." });
//   }
// };

// // Submit a payment proof.
// exports.submitPaymentProof = async (req, res) => {
//   try {
//     const billId = req.params.id;
//     const { proof_url } = req.body;

//     if (!proof_url || proof_url.trim() === "") {
//       return res.status(400).json({ message: "Proof URL is required for submission." });
//     }

//     const [result] = await db.query(
//       `UPDATE monthly_rent_bills 
//          SET payment_proof_url = ?, payment_status = 'submitted'
//          WHERE id = ?`,
//       [proof_url, billId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Bill not found." });
//     }

//     res.json({
//       message: "Payment proof submitted successfully.",
//       billId,
//     });
//   } catch (error) {
//     console.error("Error submitting payment proof:", error);
//     res.status(500).json({ message: "Server error while submitting payment proof." });
//   }
// };

// // Approve a payment with early payment credit handling.
// exports.approvePayment = async (req, res) => {
//   try {
//     const billId = req.params.id;

//     // Retrieve the current bill info.
//     const [billRows] = await db.query(
//       "SELECT due_date, original_due_date, payment_term FROM monthly_rent_bills WHERE id = ?",
//       [billId]
//     );
//     if (billRows.length === 0) {
//       return res.status(404).json({ message: "Bill not found." });
//     }

//     const { due_date, payment_term } = billRows[0];
//     const now = moment();
//     const dueDateMoment = moment(due_date, "YYYY-MM-DD HH:mm:ss");

//     let newCycle; // the number of days to add for the new cycle

//     if (now.isBefore(dueDateMoment)) {
//       // Early payment: tenant pays before the due date.
//       // Calculate the remaining days until the original due date.
//       const remainingDays = dueDateMoment.diff(now, "days");
//       // The new cycle equals the full payment term plus the remaining days.
//       newCycle = payment_term + remainingDays;
//     } else {
//       // On-time or late payment.
//       const overdueDays = now.diff(dueDateMoment, "days");
//       newCycle = payment_term - overdueDays;
//       // Safety: do not allow negative cycle length.
//       if (newCycle < 0) newCycle = 0;
//     }

//     const newBillDate = now.format("YYYY-MM-DD");
//     // New due date is now + newCycle days; using endOf("day") so that it lasts the full day.
//     const newDueDate = now
//       .clone()
//       .add(newCycle, "days")
//       .endOf("day")
//       .format("YYYY-MM-DD HH:mm:ss");

//     // Update the bill: mark the payment as paid and update cycle dates.
//     const [result] = await db.query(
//       `UPDATE monthly_rent_bills 
//          SET payment_status = 'paid', 
//              bill_date = ?, 
//              due_date = ?, 
//              original_due_date = ?
//        WHERE id = ? AND payment_status = 'submitted'`,
//       [newBillDate, newDueDate, newDueDate, billId]
//     );

//     if (result.affectedRows === 0) {
//       return res
//         .status(404)
//         .json({ message: "Bill not found or payment hasn't been submitted." });
//     }

//     res.json({
//       message: "Payment approved successfully.",
//       billId,
//       newBillDate,
//       newDueDate,
//     });
//   } catch (error) {
//     console.error("Error approving payment:", error);
//     res.status(500).json({ message: "Server error while approving payment." });
//   }
// };


// // Update overdue bills with continuous penalty accrual.
// exports.updateOverdueBills = async (req, res) => {
//   try {
//     const [bills] = await db.query(
//       `SELECT id, due_date, amount, payment_status, original_due_date FROM monthly_rent_bills 
//          WHERE payment_status NOT IN ('paid')`
//     );

//     if (!bills || bills.length === 0) {
//       return res.json({ message: "No unpaid bills found." });
//     }

//     const updates = [];
//     const currentDate = moment.utc().startOf("day");

//     for (const bill of bills) {
//       // Use original_due_date if set; otherwise, use due_date.
//       const baseDueDate = bill.original_due_date
//         ? moment.utc(bill.original_due_date).startOf("day")
//         : moment.utc(bill.due_date).startOf("day");

//       if (currentDate.isAfter(baseDueDate)) {
//         const daysOverdue = currentDate.diff(baseDueDate, "days");
//         const dailyPenaltyRate = 0.01;
//         const newPenalty = parseFloat(bill.amount) * dailyPenaltyRate * daysOverdue;
//         updates.push(
//           db.query(`UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`, [
//             newPenalty,
//             bill.id,
//           ])
//         );
//       } else {
//         updates.push(
//           db.query(`UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`, [
//             0,
//             bill.id,
//           ])
//         );
//       }
//     }

//     await Promise.all(updates);
//     res.json({
//       message: "Overdue bills updated with continuous penalty accrual.",
//     });
//   } catch (error) {
//     console.error("Error updating overdue bills:", error);
//     res.status(500).json({ message: "Server error while updating overdue bills." });
//   }
// };

// // Get a single rent bill by ID.
// exports.getBillById = async (req, res) => {
//   try {
//     const billId = req.params.id;
//     const [rows] = await db.query("SELECT * FROM monthly_rent_bills WHERE id = ?", [
//       billId,
//     ]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: "Bill not found." });
//     }
//     res.json(rows[0]);
//   } catch (error) {
//     console.error("Error fetching bill details:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while fetching bill details." });
//   }
// };
// >>>>>>> 0c2c53351b373ceb1371184ea0596d8eea8c4077
