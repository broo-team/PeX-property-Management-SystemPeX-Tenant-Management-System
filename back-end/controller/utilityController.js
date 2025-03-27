
const db = require('../db/connection');

// 1. Get the current utility rates (latest record)
exports.getUtilityRates = async (req, res) => {
  try {
    const query = "SELECT * FROM utility_rates ORDER BY created_at DESC LIMIT 1";
    const [results] = await db.query(query);
    if (results.length === 0) {
      return res.status(404).json({ error: "No utility rates found" });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error fetching utility rates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Create new utility rates record.
exports.createUtilityRates = async (req, res) => {
  const { electricity_rate, water_rate, generator_rate } = req.body;
  if (electricity_rate == null || water_rate == null || generator_rate == null) {
    return res.status(400).json({ error: "All rates are required" });
  }
  const query = "INSERT INTO utility_rates (electricity_rate, water_rate, generator_rate) VALUES (?, ?, ?)";
  try {
    const [result] = await db.query(query, [electricity_rate, water_rate, generator_rate]);
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

// 4. Record a new tenant utility usage record.
// Expects payload: { tenant_id, utility_type, previous_reading, current_reading }
exports.recordTenantUtilityUsage = async (req, res) => {
  const { tenant_id, utility_type, previous_reading, current_reading } = req.body;
  
  if (!tenant_id || !utility_type || previous_reading == null || current_reading == null) {
    return res.status(400).json({ error: "tenant_id, utility_type, previous_reading, and current_reading are required" });
  }
  
  try {
    // Fetch tenant record.
    const [tenantResults] = await db.query("SELECT * FROM tenants WHERE id = ?", [tenant_id]);
    if (tenantResults.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    const tenant = tenantResults[0];
    
    // Check utility responsibility.
    let responsible = false;
    if (utility_type === "electricity") {
      responsible = !!tenant.eeu_payment;
    } else if (utility_type === "water") {
      responsible = !!tenant.water_payment;
    } else if (utility_type === "generator") {
      responsible = !!tenant.generator_payment;
    } else {
      return res.status(400).json({ error: "Invalid utility type" });
    }
    
    if (!responsible) {
      return res.status(400).json({ error: `Tenant is not responsible for ${utility_type} usage` });
    }
    
    // Fetch current utility rates.
    const [rateResults] = await db.query("SELECT * FROM utility_rates ORDER BY created_at DESC LIMIT 1");
    if (rateResults.length === 0) {
      return res.status(404).json({ error: "Utility rates not configured" });
    }
    const rates = rateResults[0];
    
    let rate;
    if (utility_type === "electricity") {
      rate = rates.electricity_rate;
    } else if (utility_type === "water") {
      rate = rates.water_rate;
    } else if (utility_type === "generator") {
      rate = rates.generator_rate;
    }
    
    // Calculate consumption and cost.
    const consumption = current_reading - previous_reading;
    if (consumption < 0) {
      return res.status(400).json({ error: "Current reading must be greater than or equal to previous reading" });
    }
    const cost = consumption * rate;
    
    // Insert usage record with status "Bill Generated"
    const insertQuery = `
      INSERT INTO tenant_utility_usage 
      (tenant_id, utility_type, previous_reading, current_reading, rate, cost, utility_status, payment_proof_link, penalty)
      VALUES (?, ?, ?, ?, ?, ?, 'Bill Generated', NULL, 0)
    `;
    const valuesArray = [tenant_id, utility_type, previous_reading, current_reading, rate, cost];
    const [result] = await db.query(insertQuery, valuesArray);
    
    res.status(201).json({
      message: "Tenant utility usage recorded successfully",
      id: result.insertId,
      consumption,
      cost,
      utility_status: "Bill Generated",
      payment_proof_link: null,
      penalty: 0
    });
  } catch (error) {
    console.error("Error recording tenant utility usage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 5. Confirm Utility Payment via Payment Proof (Tenant submits proof).
// This updates the latest record with status "Bill Generated" to "Submitted".
exports.confirmUtilityPayment = async (req, res) => {
  const { tenant_id, payment_proof_link } = req.body;
  
  if (!tenant_id || !payment_proof_link) {
    return res.status(400).json({ error: "tenant_id and payment_proof_link are required" });
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
          ORDER BY created_at DESC
          LIMIT 1
        ) AS subQuery
      )
    `;
    
    const [result] = await db.query(updateQuery, [payment_proof_link, tenant_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No utility usage record in 'Bill Generated' state found for this tenant" });
    }
    
    res.status(200).json({ message: "Utility payment proof submitted successfully, status now: Submitted." });
  } catch (error) {
    console.error("Error confirming utility payment:", error);
    res.status(500).json({ error: "Internal server error" });
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

// 7. Approve Utility Payment (Admin Action)
// This endpoint updates a specific utility usage record from status "Submitted" to "Approved".
// It expects the unique usage record id as "usage_id" in the payload.
exports.approveUtilityPayment = async (req, res) => {
  const { usage_id } = req.body;
  
  if (!usage_id) {
    return res.status(400).json({ error: "usage_id is required" });
  }
  
  try {
    const updateQuery = `
      UPDATE tenant_utility_usage 
      SET utility_status = 'Approved'
      WHERE id = ? AND utility_status = 'Submitted'
    `;
    
    const [result] = await db.query(updateQuery, [usage_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No submitted utility usage record found for this usage ID" });
    }
    
    res.status(200).json({ message: "Utility payment approved successfully." });
  } catch (error) {
    console.error("Error approving utility payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 8. Update Overdue Penalties
// This endpoint applies a one-time 1% penalty on bills that are overdue (i.e. more than 30 days old)
// and that have not yet had a penalty applied (penalty = 0).
exports.updateOverduePenalties = async (req, res) => {
  try {
    const updateQuery = `
      UPDATE tenant_utility_usage 
      SET penalty = cost * 0.01,
          cost = cost + (cost * 0.01)
      WHERE utility_status = 'Bill Generated'
        AND created_at <= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND penalty = 0
    `;
    const [result] = await db.query(updateQuery);
    res.status(200).json({
      message: "Overdue penalties updated.",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating overdue penalties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
