const db = require('../db/connection');

// 1. Get the current utility rates (latest record) for a specific building
exports.getUtilityRates = async (req, res) => {
  try {
    const { building_id } = req.query;
    if (!building_id) {
      return res.status(400).json({ error: "Building ID is required" });
    }
    const query = `
      SELECT * FROM utility_rates 
      WHERE building_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const [results] = await db.query(query, [building_id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "No utility rates found for this building" });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error fetching utility rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Create utility rates WITH BUILDING ASSOCIATION
exports.createUtilityRates = async (req, res) => {
  const { building_id, electricity_rate, water_rate, generator_rate } = req.body;
  if (!building_id || !electricity_rate || !water_rate || !generator_rate) {
    return res.status(400).json({ error: "All fields including building are required" });
  }
  const query = `
    INSERT INTO utility_rates (building_id, electricity_rate, water_rate, generator_rate)
    VALUES (?, ?, ?, ?)
  `;
  try {
    const [result] = await db.query(query, [building_id, electricity_rate, water_rate, generator_rate]);
    res.status(201).json({ message: "Utility rates created successfully", id: result.insertId });
  } catch (error) {
    console.error("Error creating utility rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3. Get all tenant utility usage records.
exports.getTenantUtilityUsage = async (req, res) => {
  try {
    const query = "SELECT * FROM tenant_utility_usage";
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tenant utility usage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4. Record tenant utility usage with validation on readings.
//    Computes the bill based on the tenant's current rent_start_date.
//    bill_date = rent_start_date + 30 days
//    due_date = bill_date + 5 days (grace period)
const dayjs = require('dayjs');

exports.recordTenantUtilityUsage = async (req, res) => {
  const { tenant_id, utility_type, current_reading } = req.body;
  if (!tenant_id || !utility_type || current_reading === undefined) {
    return res.status(400).json({ error: "tenant_id, utility_type, and current_reading are required" });
  }

  try {
    // Fetch tenant and room details
    const [tenantData] = await db.query(
      `
      SELECT t.*, r.building_id, 
             r.eeuReader AS initial_electricity,
             r.water_reader AS initial_water,
             t.rent_start_date
      FROM tenants t
      JOIN rooms r ON r.id = CAST(t.room AS UNSIGNED)
      WHERE t.tenant_id = ?
      `,
      [tenant_id]
    );

    if (tenantData.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const tenant = tenantData[0];
    if (!tenant.building_id) {
      return res.status(400).json({ error: "Tenant is not assigned to a valid building" });
    }

    // Validate tenant's responsibility for the utility
    const responsibilityMap = {
      electricity: "eeu_payment",
      water: "water_payment",
      generator: "generator_payment",
    };

    if (!responsibilityMap[utility_type]) {
      return res.status(400).json({ error: "Invalid utility type" });
    }

    const responsible = !!tenant[responsibilityMap[utility_type]];
    if (!responsible) {
      return res.status(400).json({ error: `Tenant is not responsible for ${utility_type} usage` });
    }

    // Fetch the last utility usage record
    const [lastRecordRes] = await db.query(
      `
      SELECT current_reading, bill_date 
      FROM tenant_utility_usage 
      WHERE tenant_id = ? AND utility_type = ?
      ORDER BY bill_date DESC 
      LIMIT 1
      `,
      [tenant_id, utility_type]
    );

    // Determine previous reading
    let previous_reading;
    if (lastRecordRes.length > 0) {
      previous_reading = lastRecordRes[0].current_reading;
    } else {
      previous_reading = (utility_type === "electricity")
        ? tenant.initial_electricity
        : (utility_type === "water")
        ? tenant.initial_water
        : 0;
    }

    // Validate current reading
    if (current_reading < previous_reading) {
      return res.status(400).json({
        error: `Current reading (${current_reading}) must be ≥ previous reading (${previous_reading})`,
      });
    }

    // Fetch utility rates
    const [rateResults] = await db.query(
      `
      SELECT * FROM utility_rates 
      WHERE building_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
      `,
      [tenant.building_id]
    );

    if (rateResults.length === 0) {
      return res.status(404).json({ error: "Utility rates not configured for this building" });
    }

    const rates = rateResults[0];
    const rateValue = rates[`${utility_type}_rate`];
    const consumption = current_reading - previous_reading;
    const baseCost = consumption * rateValue;
    const cost = baseCost;

    // ---------------- BILL DATE LOGIC ----------------
    let billDate, dueDate;
    if (lastRecordRes.length === 0) {
      // FIRST BILL: Calculate based on rent_start_date +30 days +5 grace
      const rentStart = dayjs(tenant.rent_start_date);
      billDate = rentStart.add(30, 'day').toDate(); // Bill date 30 days after rent start
      dueDate = rentStart.add(35, 'day').toDate(); // Due date +5 days grace
    } else {
      // SUBSEQUENT BILLS: Existing logic (25th/end of month + remaining days +5 grace)
      const previousBillDate = dayjs(lastRecordRes[0].bill_date);
      const isEndOfMonth = previousBillDate.isSame(previousBillDate.endOf('month'), 'day');

      if (isEndOfMonth) {
        billDate = previousBillDate.add(1, 'month').endOf('month').toDate();
      } else {
        if (previousBillDate.date() === 25) {
          billDate = previousBillDate.add(1, 'month').date(25).toDate();
        } else {
          billDate = previousBillDate.add(1, 'month').toDate();
          if (dayjs(billDate).month() !== previousBillDate.add(1, 'month').month()) {
            billDate = dayjs(billDate).endOf('month').toDate();
          }
        }
      }
      dueDate = dayjs(billDate).endOf('month').add(5, 'day').toDate();
    }
    // -------------------------------------------------

    // Insert the generated bill into the usage table
    const insertQuery = `
      INSERT INTO tenant_utility_usage 
      (tenant_id, building_id, utility_type, previous_reading, current_reading, rate, cost, base_cost, bill_date, due_date, utility_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bill Generated')
    `;

    const [result] = await db.query(insertQuery, [
      tenant_id,
      tenant.building_id,
      utility_type,
      previous_reading,
      current_reading,
      rateValue,
      cost,
      baseCost,
      billDate,
      dueDate
    ]);

    res.status(201).json({
      message: "Utility usage recorded successfully",
      data: {
        id: result.insertId,
        tenant_id,
        building_id: tenant.building_id,
        utility_type,
        previous_reading,
        current_reading,
        consumption,
        rate: rateValue,
        cost,
        bill_date: billDate,
        due_date: dueDate,
        utility_status: "Bill Generated",
      },
    });

  } catch (error) {
    console.error("Error recording utility usage:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};


// 5. Confirm utility payment by uploading proof (Tenant Side)
// Updates the latest "Bill Generated" record with the provided proof and sets its status to "Submitted".
exports.confirmUtilityPayment = async (req, res) => {
  const { tenant_id } = req.body; // tenant_id comes from the body
  // The file info is now in req.file
  const payment_proof_path = req.file ? req.file.path : null; // Get the path from the uploaded file

  // Check if tenant_id is provided and if a file was uploaded
  if (!tenant_id || !payment_proof_path) {
      // If no file is uploaded, Multer might not even call the controller,
      // but this check is good practice in case of other middleware issues or if the file field name is wrong.
      return res.status(400).json({ error: "tenant_id and payment proof image are required" });
  }

  try {
      const updateQuery = `
          UPDATE tenant_utility_usage
          SET payment_proof_link = ?, utility_status = 'Submitted'
          WHERE id = (
              SELECT id FROM (
                  SELECT id
                  FROM tenant_utility_usage
                  WHERE tenant_id = ? AND utility_status = 'Bill Generated'
                  ORDER BY bill_date DESC
                  LIMIT 1
              ) AS subQuery
          )
      `;
      // Use the file path obtained from Multer in the database query
      const [result] = await db.query(updateQuery, [payment_proof_path, tenant_id]);

      if (result.affectedRows === 0) {
          // It's possible the file was uploaded but no matching record was found in the DB.
          // You might want to delete the uploaded file in this case.
          // require('fs').unlink(payment_proof_path, (err) => { if (err) console.error("Failed to delete uploaded file:", err); });
          return res.status(404).json({ error: "No utility usage record in 'Bill Generated' state found for this tenant" });
      }

      res.status(200).json({ message: "Utility payment proof submitted successfully, status now: Submitted.", filePath: payment_proof_path });

  } catch (error) {
      console.error("Error confirming utility payment:", error);
      // If a database error occurs after file upload, you might also want to delete the uploaded file.
      // if (payment_proof_path) {
      //     require('fs').unlink(payment_proof_path, (err) => { if (err) console.error("Failed to delete uploaded file on DB error:", err); });
      // }
      res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


// 6. Get tenants with their latest utility readings.
exports.getTenants = async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
        IFNULL(euu.last_reading, 0) AS last_eeu_reading,
        IFNULL(water.last_reading, 0) AS last_water_reading,
        IFNULL(gen.last_reading, 0) AS last_generator_reading
      FROM tenants t
      LEFT JOIN (
          SELECT tenant_id, MAX(current_reading) AS last_reading
          FROM tenant_utility_usage
          WHERE utility_type = 'electricity'
          GROUP BY tenant_id
      ) euu ON t.id = euu.tenant_id
      LEFT JOIN (
          SELECT tenant_id, MAX(current_reading) AS last_reading
          FROM tenant_utility_usage
          WHERE utility_type = 'water'
          GROUP BY tenant_id
      ) water ON t.id = water.tenant_id
      LEFT JOIN (
          SELECT tenant_id, MAX(current_reading) AS last_reading
          FROM tenant_utility_usage
          WHERE utility_type = 'generator'
          GROUP BY tenant_id
      ) gen ON t.id = gen.tenant_id
    `;
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 7. Approve utility payment (Admin Side)
// Updates usage status to "Approved" and resets the billing cycle by updating the tenant’s rent_start_date.
// The new cycle is based on NOW(); so if payment occurred on the last allowable day,
// the next cycle might be less than 30 days.
// 7. Approve utility payment (Admin Side)
exports.approveUtilityPayment = async (req, res) => {
  const { usage_id } = req.body;
  if (!usage_id) {
    return res.status(400).json({ error: "usage_id is required" });
  }
  try {
    // Update utility usage record status.
    const updateQuery = `
      UPDATE tenant_utility_usage 
      SET utility_status = 'Approved'
      WHERE id = ? AND utility_status = 'Submitted'
    `;
    const [result] = await db.query(updateQuery, [usage_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No submitted utility usage record found for this usage ID" });
    }
    // Remove the code that updates the tenant's rent_start_date and rent_end_date
    res.status(200).json({ message: "Utility payment approved successfully." });
  } catch (error) {
    console.error("Error approving utility payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 8. Update overdue penalties for records with a 'Bill Generated' status.
// If NOW() is later than due_date (bill_date + 5 days), penalty is applied immediately.
exports.updateOverduePenalties = async (req, res) => {
  try {
    const updateQuery = `
      UPDATE tenant_utility_usage 
      SET penalty = base_cost * 0.01 * GREATEST(DATEDIFF(NOW(), due_date), 0),
          cost = base_cost + base_cost * 0.01 * GREATEST(DATEDIFF(NOW(), due_date), 0)
      WHERE utility_status = 'Bill Generated'
        AND DATEDIFF(NOW(), due_date) > 0
    `;
    const [result] = await db.query(updateQuery);
    console.log(`Affected Rows: ${result.affectedRows}`);
    res.status(200).json({
      message: "Overdue penalties updated.",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating overdue penalties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
