const db = require('../db/connection');
const fs = require('fs'); // For file deletion

exports.createBuilding = async (req, res) => {
  console.log("req.body (text fields):", req.body);
  console.log("req.file (file info):", req.file);

  // Use the exact field names sent from the frontend (snake_case)
  const {
    buildingName,
    building_address,
    location,
    property_type,
    owner_email,
    owner_phone,
    owner_address
  } = req.body;

  // Extract uploaded image path
  const buildingImagePath = req.file ? req.file.path : null;

  // Validate all required fields
  if (
    !buildingName ||
    !building_address ||
    !location ||
    !property_type ||
    !owner_email ||
    !owner_phone ||
    !owner_address ||
    !buildingImagePath
  ) {
    // Delete uploaded image if validation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded file after validation failure:", err);
      });
    }

    return res.status(400).json({
      error: 'All required fields (including building image) must be provided.'
    });
  }

  const query = `
    INSERT INTO buildings
      (building_name, building_image, building_address, location, property_type, owner_email, owner_phone, owner_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    buildingName,
    buildingImagePath,
    building_address,
    location,
    property_type,
    owner_email,
    owner_phone,
    owner_address
  ];

  try {
    const [result] = await db.query(query, values);

    res.status(201).json({
      message: 'Building registered successfully',
      id: result.insertId,
      imagePath: buildingImagePath
    });

  } catch (err) {
    console.error('Error inserting building:', err);

    // Delete uploaded image if DB error occurs
    if (req.file) {
      fs.unlink(req.file.path, (deleteErr) => {
        if (deleteErr) console.error("Error deleting uploaded file after DB failure:", deleteErr);
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Keep your other controller functions as they are ---

exports.getBuildings = async (req, res) => {
  const query = 'SELECT id, building_name, building_image, building_address, location, property_type, owner_email, owner_phone, owner_address, suspended, created_at, status, start_date, end_date FROM buildings';
  try {
    const [results] = await db.query(query);
    // Note: building_image in the results will be the saved path (e.g., uploads/buildings/...)
    res.status(200).json({ buildings: results });
  } catch (err) {
    console.error('Error fetching buildings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateBuilding = async (req, res) => {
   // If you want to update the image, you would need similar multer logic on this route
   // For simplicity, this example only covers image upload on creation.
  const buildingId = req.params.id;
  const {
    buildingName,
    // buildingImage, // buildingImage update requires multer here too
    buildingAddress,
    location,
    propertyType,
    ownerEmail,
    ownerPhone,
    ownerAddress
  } = req.body;

   // If updating buildingImage is required, you'd get it from req.file here
   const updates = [];
   const values = [];

   // Handle potential image update if Multer middleware was applied to this route as well
   // Example (requires adding upload.single('buildingImage') middleware to the PUT route):
   // if (req.file) {
   //     updates.push('building_image = ?');
   //     values.push(req.file.path);
   //     // You might also want to delete the old image file here
   // }


  if (buildingName !== undefined) { updates.push('building_name = ?'); values.push(buildingName); }
  // if (buildingImage !== undefined) { updates.push('building_image = ?'); values.push(buildingImage); } // Comment out or modify if using file upload for update
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
    res.status(200).json({ message: 'Building suspended successfully', suspension_reason: suspension_reason }); // Optional: send reason back
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
    // The building_image field will contain the path relative to your server root (e.g., 'uploads/buildings/...')
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching building by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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


exports.resetOwnerPassword = async (req, res) => {
  const buildingId = req.params.id;
  const defaultPassword = 'Pex123'; // The default password you want to set

  // --- SECURITY WARNING ---
  // Storing passwords in plain text is HIGHLY INSECURE.
  // In a real application, you MUST hash the password before storing it.
  // Example (using bcrypt - install with npm install bcryptjs):
  // const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  // --- END SECURITY WARNING ---

  // Assuming you have a column named `password` in your `buildings` table as per your code
  const query = `
    UPDATE buildings
    SET password = ?
    WHERE id = ?
  `;
  // In a real application, you would use: SET owner_password = ?
  const values = [defaultPassword, buildingId]; // In a real application: [hashedPassword, buildingId]

  try {
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Building not found or no owner associated' });
    }

    // In a real application, you would NOT send the password back in the response.
    res.status(200).json({ message: 'Owner password reset successfully to default.' });

  } catch (err) {
    console.error('Error resetting owner password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};