// controllers/buildingController.js
const db = require('../db/connection');

// --- Existing Controllers (unchanged) ---

exports.createBuilding = async (req, res) => {
  console.log("authMiddleware req.body:", req.body);
  const {
    buildingName,
    buildingImage,
    buildingAddress,
    location,
    propertyType,
    ownerEmail,
    ownerPhone,
    ownerAddress
  } = req.body;

  if (
    !buildingName ||
    !buildingImage ||
    !buildingAddress ||
    !location ||
    !propertyType ||
    !ownerEmail ||
    !ownerPhone ||
    !ownerAddress
  ) {
    return res.status(400).json({ error: 'All required fields are missing' });
  }

  const query = `
    INSERT INTO buildings
      (building_name, building_image, building_address, location, property_type, owner_email, owner_phone, owner_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    buildingName,
    buildingImage,
    buildingAddress,
    location,
    propertyType,
    ownerEmail,
    ownerPhone,
    ownerAddress
  ];

  try {
    const [result] = await db.query(query, values);
    res.status(201).json({
      message: 'Building registered successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Error inserting building:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBuildings = async (req, res) => {
  const query = 'SELECT id, building_name, building_image, building_address, location, property_type, owner_email, owner_phone, owner_address, suspended, created_at, status, start_date, end_date FROM buildings';
  try {
    const [results] = await db.query(query);
    res.status(200).json({ buildings: results });
  } catch (err) {
    console.error('Error fetching buildings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateBuilding = async (req, res) => {
  const buildingId = req.params.id;
  const {
    buildingName,
    buildingImage,
    buildingAddress,
    location,
    propertyType,
    ownerEmail,
    ownerPhone,
    ownerAddress
  } = req.body;

  const updates = [];
  const values = [];
  if (buildingName !== undefined) { updates.push('building_name = ?'); values.push(buildingName); }
  if (buildingImage !== undefined) { updates.push('building_image = ?'); values.push(buildingImage); }
  if (buildingAddress !== undefined) { updates.push('building_address = ?'); values.push(buildingAddress); }
  if (location !== undefined) { updates.push('location = ?'); values.push(location); }
  if (propertyType !== undefined) { updates.push('property_type = ?'); values.push(propertyType); }
  if (ownerEmail !== undefined) { updates.push('owner_email = ?'); values.push(ownerEmail); }
  if (ownerPhone !== undefined) { updates.push('owner_phone = ?'); values.push(ownerPhone); }
  if (ownerAddress !== undefined) { updates.push('owner_address = ?'); values.push(ownerAddress); }

  if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
  }

  const query = `UPDATE buildings SET ${updates.join(', ')} WHERE id = ?`;
  values.push(buildingId);

  try {
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.status(200).json({ message: 'Building updated successfully' });
  } catch (err) {
    console.error('Error updating building:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Modified suspendBuilding
exports.suspendBuilding = async (req, res) => {
  const buildingId = req.params.id;
  const { suspension_reason } = req.body;

  const query = `
    UPDATE buildings
    SET suspended = 1, suspension_reason = ?
    WHERE id = ?`;
  const values = [suspension_reason, buildingId];

  try {
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.status(200).json({ message: 'Building suspended successfully', suspension_reason: suspension_reason });
  } catch (err) {
    console.error('Error suspending building:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBuildingById = async (req, res) => {
  const buildingId = req.params.id;
  const query = "SELECT id, building_name, building_image, building_address, location, property_type, owner_email, owner_phone, owner_address, suspended, created_at, status, start_date, end_date FROM buildings WHERE id = ?";
  try {
    const [results] = await db.query(query, [buildingId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching building by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- New Controller for Activating with Dates ---

// Defined and exported in one step here
exports.activateBuildingWithDates = async (req, res) => {
  const buildingId = req.params.id;
  const { start_date, end_date } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required for activation' });
  }

  const query = `
    UPDATE buildings
    SET status = 'active', start_date = ?, end_date = ?, suspended = 0, suspension_reason = NULL
    WHERE id = ?
  `;
  const values = [start_date, end_date, buildingId];

  try {
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }

    res.status(200).json({ message: 'Building activated successfully with dates' });

  } catch (err) {
    console.error('Error activating building with dates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- REMOVE THIS REDUNDANT LINE ---
// exports.activateBuildingWithDates = activateBuildingWithDates; // <--- DELETE THIS LINE

// Keep the other exports if they were there before
// For example, if you had:
// module.exports = {
//    createBuilding,
//    getBuildings,
//    // ... etc
// }
// Ensure activateBuildingWithDates is included in your main module.exports if you are using that style.
// Based on your original code structure, it seems you are using individual exports.
// So just removing the duplicate line should fix it.

exports.suspendBuilding = async (req, res) => {
  const buildingId = req.params.id;
  const { suspension_reason } = req.body; // <--- Extract reason from body


  const query = `
    UPDATE buildings
    SET suspended = 1, suspension_reason = ?
    WHERE id = ?`;
  const values = [suspension_reason, buildingId];

  try {
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.status(200).json({ message: 'Building suspended successfully', suspension_reason: suspension_reason }); // Optional: send reason back
  } catch (err) {
    console.error('Error suspending building:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
