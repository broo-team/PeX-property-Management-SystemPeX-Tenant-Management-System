const db = require('../db/connection');

// Create a new maintenance request (tenant submission)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    // Extract necessary details from the request body.
    const { tenant_id, stallCode, building_id, issueDescription, category } = req.body;
    
    // Validate that all required fields are provided.
    if (!tenant_id || !stallCode || !building_id || !issueDescription || !category) {
      return res.status(400).json({ error: "Please provide tenant_id, stallCode, building_id, issueDescription, and category" });
    }
    
    // Insert a new maintenance request.
    // tenantApproved will default to false (assuming the DB schema default)
    const [result] = await db.execute(
      `INSERT INTO maintenance_requests (tenant_id, stallCode, building_id, issueDescription, category, status)
       VALUES (?, ?, ?, ?, ?, 'Submitted')`,
      [tenant_id, stallCode, building_id, issueDescription, category]
    );
    
    const insertedId = result.insertId;
    
    // Fetch the newly created record to send back in the response.
    const [rows] = await db.execute(
      `SELECT * FROM maintenance_requests WHERE id = ?`,
      [insertedId]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create maintenance request", details: err.message });
  }
};

// Retrieve maintenance requests with optional filtering (with join to tenants table)
exports.getMaintenanceRequests = async (req, res) => {
  try {
    let query = `
      SELECT m.*, 
             t.full_name AS full_name, 
             r.roomName AS roomName, 
             t.building_id AS tenantBuildingId, 
             t.tenant_id AS tenantCode
      FROM maintenance_requests m
      JOIN tenants t ON m.tenant_id = t.id
      JOIN rooms r ON t.room = r.id
    `;
    const conditions = [];
    const params = [];

    if (req.query.tenantName) {
      conditions.push("t.full_name LIKE ?");
      params.push(`%${req.query.tenantName}%`);
    }
    if (req.query.status) {
      conditions.push("m.status = ?");
      params.push(req.query.status);
    }
    if (req.query.createdAt) {
      // Assumes createdAt is provided in YYYY-MM-DD format.
      conditions.push("DATE(m.createdAt) = ?");
      params.push(req.query.createdAt);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY m.createdAt DESC";

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve maintenance requests", details: err.message });
  }
};

// Update a maintenance request based on an action type.
exports.updateMaintenanceRequest = async (req, res) => {
  try {
    const { type, payload } = req.body;
    const requestId = req.params.id;

    // First, ensure the request exists.
    const [existingRows] = await db.execute(
      `SELECT * FROM maintenance_requests WHERE id = ?`, [requestId]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    let updateQuery = "";
    let updateParams = [];

    switch (type) {
      case "financeConfirm":
        if (payload.price === undefined) {
          return res.status(400).json({ error: "Price is required." });
        }
        updateQuery = `UPDATE maintenance_requests 
                       SET price = ?, status = 'Finance Confirmed' 
                       WHERE id = ?`;
        updateParams = [payload.price, requestId];
        break;
      case "ownerApprove":
        updateQuery = `UPDATE maintenance_requests 
                       SET status = 'Owner Approved' 
                       WHERE id = ?`;
        updateParams = [requestId];
        break;
      case "ownerPending":
        if (!payload.reason) {
          return res.status(400).json({ error: "Reason is required." });
        }
        updateQuery = `UPDATE maintenance_requests 
                       SET status = 'Owner Pending', reason = ? 
                       WHERE id = ?`;
        updateParams = [payload.reason, requestId];
        break;
      case "ownerReject":
        if (!payload.reason) {
          return res.status(400).json({ error: "Reason is required." });
        }
        updateQuery = `UPDATE maintenance_requests 
                       SET status = 'Owner Rejected', reason = ? 
                       WHERE id = ?`;
        updateParams = [payload.reason, requestId];
        break;
      case "maintenanceSchedule":
        if (!payload.scheduledDate) {
          return res.status(400).json({ error: "Scheduled date is required." });
        }
        updateQuery = `UPDATE maintenance_requests 
                       SET scheduledDate = ?, status = 'Maintenance Scheduled' 
                       WHERE id = ?`;
        updateParams = [payload.scheduledDate, requestId];
        break;
      case "resolve":
        updateQuery = `UPDATE maintenance_requests 
                       SET status = 'Resolved' 
                       WHERE id = ?`;
        updateParams = [requestId];
        break;
      case "tenantApprove":
        // Check current status; if it's already Resolved, preserve that status.
        const currentStatus = existingRows[0].status;
        if (currentStatus === "Resolved") {
          updateQuery = `UPDATE maintenance_requests 
                         SET tenantApproved = true 
                         WHERE id = ?`;
        } else {
          updateQuery = `UPDATE maintenance_requests 
                         SET tenantApproved = true, status = 'Tenant Approved' 
                         WHERE id = ?`;
        }
        updateParams = [requestId];
        break;
      default:
        return res.status(400).json({ error: "Invalid update type" });
    }

    await db.execute(updateQuery, updateParams);
    // Retrieve the updated maintenance request with tenant details.
    const [updatedRows] = await db.execute(
      `SELECT m.*, 
              t.full_name AS tenantName, 
              t.room, 
              t.building_id, 
              t.tenant_id AS tenantCode
       FROM maintenance_requests m
       JOIN tenants t ON m.tenant_id = t.id
       WHERE m.id = ?`, [requestId]
    );
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update maintenance request", details: err.message });
  }
};

// Delete a maintenance request.
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    await db.execute(`DELETE FROM maintenance_requests WHERE id = ?`, [requestId]);
    res.json({ message: "Maintenance request deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete maintenance request", details: err.message });
  }
};
