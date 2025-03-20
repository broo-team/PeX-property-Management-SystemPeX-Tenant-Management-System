// // controllers/rentPaymentController.js
// const db = require('../db/connection');
// const dayjs = require('dayjs');

// /**
//  * Create a new bill record for a tenant based on tenant registration data.
//  *
//  * This function:
//  *   - Reads tenant data (rent_start_date, rent_end_date, payment_term, monthlyRent) from the tenants table.
//  *   - Sets the bill_date to the current date.
//  *   - Calculates due_date as bill_date + payment_term, and grace_period_end as due_date + 5 days.
//  *   - Uses the tenant's registration dates as payment_start_date and payment_end_date.
//  *
//  * Request Body requires:
//  *   { tenant_id: string }
//  */
// exports.createBillFromTenant = async (req, res) => {
//   try {
//     const { tenant_id } = req.body;
//     if (!tenant_id) {
//       return res.status(400).json({ error: "tenant_id is required" });
//     }
    
//     // Fetch tenant data from tenant registration table.
//     const [tenantRows] = await db.query(
//       "SELECT rent_start_date, rent_end_date, payment_term, monthlyRent FROM tenants WHERE tenant_id = ?",
//       [tenant_id]
//     );
//     if (!tenantRows.length) {
//       return res.status(404).json({ error: "Tenant not found" });
//     }
//     const tenant = tenantRows[0];
    
//     // Use tenant registration info for the payment period.
//     const paymentStartDate = dayjs(tenant.rent_start_date);
//     const paymentEndDate   = dayjs(tenant.rent_end_date);
    
//     // Set the bill date to today.
//     const billDate = dayjs();
//     // Calculate due date using the tenant's payment_term.
//     const term = parseInt(tenant.payment_term);
//     const dueDate = billDate.add(term, 'day');
//     // 5-day grace period after the due date.
//     const graceEnd = dueDate.add(5, 'day');
    
//     // Use the monthly rent as the base for cost. At bill creation, no penalty is applied.
//     const monthlyRent = parseFloat(tenant.monthlyRent);
//     const cost = monthlyRent;
    
//     const query = `
//       INSERT INTO rent_payments 
//         (tenant_id, rentTerm, bill_date, due_date, grace_period_end, payment_start_date, payment_end_date, previous_rent, current_rent, cost, penalty, rent_status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;
//     const values = [
//       tenant_id,
//       tenant.payment_term,                          // Payment term from tenant record.
//       billDate.format('YYYY-MM-DD'),                // Bill creation date.
//       dueDate.format('YYYY-MM-DD'),                 // Due date.
//       graceEnd.format('YYYY-MM-DD'),                // End of grace period.
//       paymentStartDate.format('YYYY-MM-DD'),         // Payment cycle start date (from tenant registration).
//       paymentEndDate.format('YYYY-MM-DD'),           // Payment cycle end date (from tenant registration).
//       0,                                            // previous_rent [set to 0 or add further logic as needed].
//       monthlyRent.toFixed(2),                       // current_rent.
//       cost.toFixed(2),                              // Total cost (rent + any penalty applied later).
//       0,                                            // No penalty at creation.
//       'pending'                                     // Initial rent_status.
//     ];
    
//     const [result] = await db.query(query, values);
//     res.status(201).json({ message: "Bill created successfully", billId: result.insertId });
    
//   } catch (error) {
//     console.error("Error creating bill from tenant data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
