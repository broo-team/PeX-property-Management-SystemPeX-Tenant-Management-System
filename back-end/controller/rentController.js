// controllers/rentController.js
const db = require("../db/connection");
const moment = require("moment");

const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

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
// Generate a new rent bill.
exports.generateBill = async (req, res) => {
  try {
    // Destructure required fields.
    const { tenant_id, bill_date, amount, due_date, original_due_date } = req.body;
    if (!tenant_id || !bill_date || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Retrieve tenant info including the building_id.
    const [tenantRows] = await db.query(
      `SELECT payment_term, rent_end_date, building_id FROM tenants WHERE id = ?`,
      [tenant_id]
    );
    if (tenantRows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    
    // Extract payment term and building_id.
    const tenantPaymentTerm = Number(tenantRows[0].payment_term) || 30;
    const buildingId = tenantRows[0].building_id;

    // If due_date is not provided, compute it as bill_date + tenantPaymentTerm days,
    // and set it to the very end of that day.
    let finalDueDate = due_date;
    let finalOriginalDueDate = original_due_date;
    if (!due_date) {
      finalDueDate = moment(bill_date)
        .add(tenantPaymentTerm, "days")
        .endOf("day")
        .format(DATE_FORMAT);
      finalOriginalDueDate = finalDueDate;
    }

    const penalty = 0;
    const payment_status = "pending";

    // Insert the new bill including the building_id.
    const [result] = await db.query(
      `INSERT INTO monthly_rent_bills
         (building_id, tenant_id, bill_date, amount, penalty, payment_status, payment_term, due_date, original_due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buildingId,
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

// Approve a payment with early payment adjustment.
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
    const dueDateMoment = moment(due_date, DATE_FORMAT);

    let newCycle;
    if (now.isBefore(dueDateMoment)) {
      // Early Payment: use the standard payment term.
      newCycle = payment_term;
    } else {
      // On-time or late: subtract overdue days.
      const overdueDays = now.diff(dueDateMoment, "days");
      newCycle = payment_term - overdueDays;
      if (newCycle < 0) newCycle = 0;
    }

    // Set new bill date and new due date.
    const newBillDate = now.format("YYYY-MM-DD");
    const newDueDate = now
      .clone()
      .add(newCycle, "days")
      .endOf("day")
      .format(DATE_FORMAT);

    // Update the bill: mark as paid and update cycle dates.
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

// Update overdue bills with capped penalty accumulation.
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
      const baseDueDate = moment.utc(bill.due_date).startOf("day");
      if (currentDate.isAfter(baseDueDate)) {
        const daysOverdue = currentDate.diff(baseDueDate, "days");
        const dailyPenaltyRate = 0.01;
        const effectiveOverdueDays = Math.min(daysOverdue, bill.payment_term);
        const newPenalty = parseFloat(bill.amount) * dailyPenaltyRate * effectiveOverdueDays;
        const monthsOverdue = Math.floor(daysOverdue / bill.payment_term);
        const newTotalDue = parseFloat(bill.amount) * (1 + monthsOverdue) + newPenalty;

        updates.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ?, totalDue = ? WHERE id = ?`,
            [newPenalty, newTotalDue, bill.id]
          )
        );
      } else {
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
    const [rows] = await db.query("SELECT * FROM monthly_rent_bills WHERE id = ?", [billId]);
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

// Terminate new tenants who have not paid within three days.
// Here we assume that the first (and automatically generated) bill's date matches the tenant's registration date.
// If the bill remains pending for 3 or more days, we terminate the tenant.
// Terminate new tenants who have not paid within three days.
// Here we assume that the first (and automatically generated) bill's date matches the tenant's registration date.
// If the bill remains pending for 3 or more days, we terminate the tenant.
exports.terminateNewTenants = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT t.id as tenantId
       FROM monthly_rent_bills b
       JOIN tenants t ON b.tenant_id = t.id
       WHERE DATE(b.bill_date) = DATE(t.created_at)
         AND b.payment_status = 'pending'
         AND TIMESTAMPDIFF(DAY, b.bill_date, NOW()) >= 3`
    );
    
    // Extract tenant IDs from the results.
    const tenantIds = results.map(row => row.tenantId);
    
    if (tenantIds.length) {
      // Use backticks around terminated.
      await db.query(
        "UPDATE tenants SET `terminated` = 1 WHERE id IN (?)",
        [tenantIds]
      );
    }
    
    res.json({
      message: "Processed new tenant terminations.",
      terminated: tenantIds
    });
  } catch (error) {
    console.error("Error terminating new tenants:", error);
    res.status(500).json({ message: "Server error during tenant termination." });
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
