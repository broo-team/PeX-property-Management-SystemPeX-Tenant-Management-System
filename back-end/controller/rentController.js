
const db = require("../db/connection");
const moment = require("moment");

const DATE_FORMAT = "YYYY-MM-DD";
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

// Get all rent bills.
exports.generateBill = async (req, res) => {
  try {
    const { tenant_id, bill_date, amount, dueDate: requestedDueDate } = req.body;

    // Validate inputs
    if (!tenant_id || !bill_date || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Fetch tenant info
    const [tenantRows] = await db.query(
      "SELECT tenant_id, payment_term, building_id FROM tenants WHERE tenant_id = ?",
      [tenant_id]
    );
    if (tenantRows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }
    const tenant = tenantRows[0];
    const paymentTerm = Number(tenant.payment_term) || 30;

    // Fetch the LATEST bill's due_date (if exists)
    const [existingBills] = await db.query(
      `SELECT due_date 
       FROM monthly_rent_bills 
       WHERE tenant_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [tenant_id]
    );

    let originalDueDate, finalDueDate;

    if (existingBills.length > 0) {
      // Use the latest bill's due_date as the new original_due_date
      originalDueDate = existingBills[0].due_date;

      // Calculate new due date based on the latest bill's due_date day
      const originalDay = moment(originalDueDate, DATE_FORMAT).date();
      const billDateMoment = moment(bill_date);

      let newDueDateMoment = billDateMoment.clone().date(originalDay);
      if (!newDueDateMoment.isValid()) {
        newDueDateMoment = billDateMoment.clone().endOf("month");
      }
      finalDueDate = newDueDateMoment.endOf("day").format(DATE_FORMAT);
    } else {
      // First bill: Set original_due_date from input or payment_term
      if (requestedDueDate) {
        finalDueDate = moment(requestedDueDate)
          .endOf("day")
          .format(DATE_FORMAT);
      } else {
        finalDueDate = moment(bill_date)
          .add(paymentTerm, "days")
          .endOf("day")
          .format(DATE_FORMAT);
      }
      originalDueDate = finalDueDate;
    }

    // Insert new bill with previous bill's due_date as original_due_date
    const [result] = await db.query(
      `INSERT INTO monthly_rent_bills
        (building_id, tenant_id, bill_date, amount, penalty, payment_status, payment_term, due_date, original_due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant.building_id,
        tenant.tenant_id,
        bill_date,
        amount,
        0,
        "pending",
        paymentTerm,
        finalDueDate,
        originalDueDate,
      ]
    );

    res.status(201).json({
      billId: result.insertId,
      due_date: finalDueDate,
      original_due_date: originalDueDate,
    });
  } catch (error) {
    console.error("Error generating bill:", error);
    res.status(500).json({ message: "Server error while generating bill." });
  }
};
exports.approvePayment = async (req, res) => {
  try {
    const billId = req.params.id;
    // Fetch bill details including tenant_id and original_due_date
    const [billRows] = await db.query(
      `SELECT 
        tenant_id, 
        original_due_date, 
        payment_term 
       FROM monthly_rent_bills 
       WHERE id = ?`,
      [billId]
    );

    if (billRows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const bill = billRows[0];
    const paymentTerm = Number(bill.payment_term) || 30;

    // Check if tenant has any previous paid bills (EXCLUDING this one)
    const [paidCountRows] = await db.query(
      `SELECT COUNT(*) AS paid_count 
       FROM monthly_rent_bills 
       WHERE tenant_id = ? 
         AND payment_status = 'paid' 
         AND id != ?`,
      [bill.tenant_id, billId]
    );
    const paidCount = paidCountRows[0].paid_count;

    let nextDueDate;
    if (paidCount === 0) {
      // First payment: Keep due_date as-is
      nextDueDate = moment(bill.original_due_date, DATE_FORMAT)
        .endOf("day")
        .format(DATE_FORMAT);
    } else {
      // Subsequent payments: original_due_date + payment_term
      nextDueDate = moment(bill.original_due_date, DATE_FORMAT)
        .add(paymentTerm, "days")
        .endOf("day")
        .format(DATE_FORMAT);
    }

    // Update payment status and dates
    const paymentDate = moment().utc().startOf("day").format("YYYY-MM-DD");
    await db.query(
      `UPDATE monthly_rent_bills 
       SET payment_status = 'paid', 
           payment_date = ?, 
           due_date = ?
       WHERE id = ?`,
      [paymentDate, nextDueDate, billId]
    );

    res.json({
      success: true,
      nextDueDate,
    });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Approval failed" });
  }
};

// Submit a payment proof.
exports.submitPaymentProof = async (req, res) => {
  try {
    const billId = req.params.id;
    // const { proof_url } = req.body; // No longer needed

    // Access the uploaded file information from req.file
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ message: "Payment proof image is required for submission." });
    }

    // The path where the file was saved by Multer
    const proofPath = uploadedFile.path;

    // You might want to store a URL if you're uploading to cloud storage
    // const proofUrl = 'YOUR_CLOUD_STORAGE_URL/' + uploadedFile.filename; // Example for cloud storage


    const [result] = await db.query(
      `UPDATE monthly_rent_bills
           SET payment_proof_url = ?, payment_status = 'submitted'
           WHERE id = ?`,
      [proofPath, billId] // Store the file path (or URL) in the database
    );

    if (result.affectedRows === 0) {
      // Clean up the uploaded file if the bill is not found
      // You might need a mechanism to clean up orphaned files periodically
      // if using local storage and not immediately deleting.
      // For a simple case, you could unlink the file here, but be careful.
      // fs.unlinkSync(proofPath); // Requires 'fs' module
      return res.status(404).json({ message: "Bill not found." });
    }

    res.json({
      message: "Payment proof submitted successfully.",
      billId,
      filePath: proofPath // Optionally return the stored file path/URL
    });
  } catch (error) {
    console.error("Error submitting payment proof:", error);
    // You might want to clean up the uploaded file in case of a database error
    // if using local storage.
    // if (req.file && fs) { // Check if file exists and fs is imported
    //   fs.unlinkSync(req.file.path);
    // }
    res.status(500).json({ message: "Server error while submitting payment proof." });
  }
};
exports.updateOverdueBills = async (req, res) => {
  try {
    const [bills] = await db.query(`
      SELECT
        id,
        building_id,
        tenant_id,
        bill_date,
        due_date,
        amount,
        penalty,
        payment_status,
        payment_term,
        payment_date,
        original_due_date
      FROM monthly_rent_bills
      WHERE payment_status IN ('pending', 'paid')
    `);

    const currentDate = moment.utc().startOf("day");
    const updatePromises = [];
    const newBillPromises = [];
    const AUTO_RENEW_THRESHOLD = 10;

    for (const bill of bills) {
      const dueDate = moment.utc(bill.due_date, DATE_FORMAT).startOf("day");
      const daysOverdue = currentDate.diff(dueDate, "days");
      const paymentTerm = bill.payment_term;

      // 1. Apply penalty to overdue pending bills
      if (bill.payment_status === "pending" && daysOverdue > 0) {
        const dailyPenaltyRate = 0.01;
        const newPenalty = Math.min(
          bill.amount * dailyPenaltyRate * daysOverdue,
          bill.amount
        );
        updatePromises.push(
          db.query(
            `UPDATE monthly_rent_bills SET penalty = ? WHERE id = ?`,
            [newPenalty, bill.id]
          )
        );
      }

      // 2. Generate new bill if overdue by full term
      if (bill.payment_status === "pending" && daysOverdue >= paymentTerm) {
        const [existingFutureBill] = await db.query(
          `SELECT id FROM monthly_rent_bills
           WHERE tenant_id = ? 
             AND DATE(due_date) >= DATE(?)
             AND payment_status = 'pending'
             AND id != ?
           LIMIT 1`,
          [bill.tenant_id, dueDate.add(1, "day").format("YYYY-MM-DD"), bill.id]
        );

        if (!existingFutureBill.length) {
          // Fetch the LATEST bill's due_date
          const [latestBill] = await db.query(
            `SELECT due_date 
             FROM monthly_rent_bills 
             WHERE tenant_id = ? 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [bill.tenant_id]
          );

          if (!latestBill.length) continue;

          const latestDueDate = latestBill[0].due_date;
          const originalDay = moment(latestDueDate, DATE_FORMAT).date();

          // Calculate new due date based on latest bill's due_date day
          const newDueDate = moment(bill.due_date, DATE_FORMAT)
            .add(paymentTerm, "days")
            .date(originalDay)
            .endOf("day")
            .format(DATE_FORMAT);

          newBillPromises.push(
            db.query(
              `INSERT INTO monthly_rent_bills
               (building_id, tenant_id, bill_date, due_date, amount, payment_status, payment_term, original_due_date)
               VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
              [
                bill.building_id,
                bill.tenant_id,
                moment().format("YYYY-MM-DD"),
                newDueDate,
                bill.amount,
                paymentTerm,
                newDueDate, // Set original_due_date to the new due_date
              ]
            )
          );
        }
      }

      // 3. Auto-renew: Generate next bill when 10 days left
      else if (bill.payment_status === "paid" && bill.payment_date && paymentTerm) {
        const nextDueDate = moment(bill.due_date, DATE_FORMAT)
        .add(1, "month")
        .endOf("day")
        .format(DATE_FORMAT);

      const daysUntilNextDue = moment(nextDueDate, DATE_FORMAT)
        .endOf("day")
        .diff(currentDate, "days");

      if (daysUntilNextDue === AUTO_RENEW_THRESHOLD) {
        const [futureUnpaid] = await db.query(
          `SELECT id FROM monthly_rent_bills
           WHERE tenant_id = ? 
             AND DATE(due_date) > DATE(?)
             AND payment_status = 'pending'
           LIMIT 1`,
          [bill.tenant_id, bill.due_date]
        );

        if (!futureUnpaid.length) {
          const [existingFutureBill] = await db.query(
            `SELECT id FROM monthly_rent_bills
             WHERE tenant_id = ? 
               AND DATE(due_date) = DATE(?)
               AND payment_status = 'pending'
             LIMIT 1`,
            [bill.tenant_id, nextDueDate]
          );

          if (!existingFutureBill.length) {
            const [firstBill] = await db.query(
              `SELECT original_due_date 
               FROM monthly_rent_bills 
               WHERE tenant_id = ? 
               ORDER BY created_at ASC 
               LIMIT 1`,
              [bill.tenant_id]
            );

            if (!firstBill.length) continue;

            const originalDueDate = firstBill[0].original_due_date;
            const originalDay = moment(originalDueDate, DATE_FORMAT).date();

            const previousDueDate = moment(bill.due_date, DATE_FORMAT);
            let newDueDateMoment = previousDueDate
              .add(1, "month")
              .date(originalDay);

            if (!newDueDateMoment.isValid()) {
              newDueDateMoment = previousDueDate.add(1, "month").endOf("month");
            }

            const newDueDate = newDueDateMoment.endOf("day").format(DATE_FORMAT);
            const newBillDate = moment().format("YYYY-MM-DD");

            newBillPromises.push(
              db.query(
                `INSERT INTO monthly_rent_bills
                 (building_id, tenant_id, bill_date, due_date, amount, payment_status, payment_term, original_due_date)
                 VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [
                  bill.building_id,
                  bill.tenant_id,
                  newBillDate,
                  newDueDate,
                  bill.amount,
                  paymentTerm,
                  originalDueDate,
                ]
              )
            );
          }
        }
      }
    }
    }

    await Promise.all([...updatePromises, ...newBillPromises]);
    res.json({ message: "Bills and penalties updated successfully" });
  } catch (error) {
    console.error("Error updating overdue bills:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Terminate new tenants who have not paid within three days.
// This function assumes that the first (automatically generated) bill's date matches the tenant's registration date.
// If the bill remains pending for 3 or more days, we terminate the tenant.
exports.terminateNewTenants = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT t.id as tenantId
       FROM monthly_rent_bills b
       JOIN tenants t ON b.tenant_id = t.tenant_id
       WHERE DATE(b.bill_date) = DATE(t.created_at)
         AND b.payment_status = 'pending'
         AND TIMESTAMPDIFF(DAY, b.bill_date, NOW()) >= 3`
    );
    
    // Extract tenant IDs from the results.
    const tenantIds = results.map(row => row.tenantId);
    
    if (tenantIds.length) {
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
