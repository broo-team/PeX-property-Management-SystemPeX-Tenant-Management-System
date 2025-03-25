// controllers/buildingController.js
const db = require('../db/connection');

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
    return res.status(400).json({ error: 'All fields are required' });
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
  const query = 'SELECT * FROM buildings';
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

  const query = `
    UPDATE buildings 
    SET building_name = ?, building_image = ?, building_address = ?, location = ?, property_type = ?, owner_email = ?, owner_phone = ?, owner_address = ?
    WHERE id = ?
  `;
  const values = [
    buildingName,
    buildingImage,
    buildingAddress,
    location,
    propertyType,
    ownerEmail,
    ownerPhone,
    ownerAddress,
    buildingId
  ];

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

exports.suspendBuilding = async (req, res) => {
  const buildingId = req.params.id;
  const query = `UPDATE buildings SET suspended = ? WHERE id = ?`;
  const values = [true, buildingId];

  try {
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.status(200).json({ message: 'Building suspended successfully' });
  } catch (err) {
    console.error('Error suspending building:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getBuildingById = async (req, res) => {
  const buildingId = req.params.id;
  const query = "SELECT * FROM buildings WHERE id = ?";
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
