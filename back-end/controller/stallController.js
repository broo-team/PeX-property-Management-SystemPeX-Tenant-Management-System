// // controllers/stallController.js
// const db = require('../db/connection');

// // Improved helper function to parse rooms JSON
// function parseRoomsValue(val) {
//   if (!val) return [];
//   try {
//     const parsed = JSON.parse(val);
//     return Array.isArray(parsed) ? parsed : [parsed];
//   } catch (error) {
//     console.error("Error parsing rooms JSON:", error, "value:", val);
//     // Fallback: if it's a non-empty string, wrap it in an array.
//     return typeof val === "string" && val.length > 0 ? [val] : [];
//   }
// }

// exports.createStall = async (req, res) => {
//   const { stallCode, building_id, rooms = [] } = req.body;

//   if (!stallCode || !building_id) {
//     return res.status(400).json({ error: 'Both stallCode and building_id are required' });
//   }

//   // Query to create a new stall if it doesn't already exist.
//   const queryInsert = "INSERT INTO stalls (stallCode, building_id, rooms) VALUES (?, ?, ?)";
  
//   try {
//     // Check if a stall with the given stallCode already exists.
//     const [existingStallRows] = await db.query("SELECT * FROM stalls WHERE stallCode = ?", [stallCode]);
    
//     if (existingStallRows.length > 0) {
//       // Stall exists—append the new room(s) to the JSON stored in the 'rooms' column.
//       let existingStall = existingStallRows[0];
//       // Use our helper, which handles invalid JSON gracefully.
//       let existingRooms = parseRoomsValue(existingStall.rooms);

//       // Append the new room objects (which may include size, monthlyRent, eeuReader, etc.)
//       const updatedRooms = [...existingRooms, ...rooms];

//       // Update the stall record with the new rooms array.
//       const queryUpdate = "UPDATE stalls SET rooms = ? WHERE stallCode = ?";
//       await db.query(queryUpdate, [JSON.stringify(updatedRooms), stallCode]);
      
//       return res.status(200).json({ message: 'New room(s) added to existing stall successfully' });
//     } else {
//       // Stall doesn't exist, so create a new stall.
//       // If room details are provided, they are stored in the rooms column.
//       const [result] = await db.query(queryInsert, [stallCode, building_id, JSON.stringify(rooms)]);
//       return res.status(201).json({ message: 'Stall created successfully', id: result.insertId });
//     }
//   } catch (err) {
//     console.error('Error creating or updating stall:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// exports.getStalls = async (req, res) => {
//   const query = "SELECT * FROM stalls";
//   try {
//     const [results] = await db.query(query);
//     res.status(200).json(results);
//   } catch (err) {
//     console.error('Error fetching stalls:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// exports.updateStallDetails = async (req, res) => {
//   const stallCode = req.params.stallCode;
//   const { size, monthlyRent, eeuReader, rooms } = req.body; // Expect rooms to be an array of room objects

//   try {
//     // Fetch current stall record.
//     const [existingStallRows] = await db.query("SELECT * FROM stalls WHERE stallCode = ?", [stallCode]);
//     if (existingStallRows.length === 0) {
//       return res.status(404).json({ error: 'Stall not found' });
//     }

//     const existingStall = existingStallRows[0];
//     // Use our helper to safely parse existing rooms.
//     let existingRooms = parseRoomsValue(existingStall.rooms);

//     // Append new room details provided in the payload (if any)
//     const updatedRooms = rooms ? [...existingRooms, ...rooms] : existingRooms;

//     // Update stall details along with the merged room details.
//     const query = `
//       UPDATE stalls 
//       SET size = ?, monthlyRent = ?, eeuReader = ?, rooms = ?
//       WHERE stallCode = ?
//     `;
//     const values = [size, monthlyRent, eeuReader, JSON.stringify(updatedRooms), stallCode];

//     const [result] = await db.query(query, values);
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Stall not found' });
//     }

//     res.status(200).json({ message: 'Stall details updated successfully', updatedRooms });
//   } catch (err) {
//     console.error('Error updating stall details:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// exports.deleteStall = async (req, res) => {
//   const stallCode = req.params.stallCode;
//   const query = "DELETE FROM stalls WHERE stallCode = ?";
//   try {
//     const [result] = await db.query(query, [stallCode]);
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Stall not found' });
//     }
//     res.status(200).json({ message: 'Stall deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting stall:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// /*
//   Updated createRoom: Instead of inserting into a separate rooms table,
//   this function adds a new room object to the JSON stored in the stalls table.
// */
// exports.createRoom = async (req, res) => {
//   const stallCode = req.params.stallCode;
//   const { roomName, size, monthlyRent, eeuReader } = req.body;

//   try {
//     // Retrieve the stall record.
//     const [stallRows] = await db.query("SELECT * FROM stalls WHERE stallCode = ?", [stallCode]);
//     if (stallRows.length === 0) {
//       return res.status(404).json({ error: "Stall not found" });
//     }

//     // Use our helper to parse the rooms.
//     let existingRooms = parseRoomsValue(stallRows[0].rooms);
    
//     // Create a new room object.
//     const newRoom = { roomName, size, monthlyRent, eeuReader, created_at: new Date() };
//     existingRooms.push(newRoom);
    
//     // Update the stall record.
//     await db.query("UPDATE stalls SET rooms = ? WHERE stallCode = ?", [JSON.stringify(existingRooms), stallCode]);
//     res.status(200).json({ message: "Room added successfully", room: newRoom });
//   } catch (err) {
//     console.error("Error creating room:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// /*
//   Updated getRooms: Reads the JSON from the stalls table's rooms column.
// */
// exports.getRooms = async (req, res) => {
//   const { stallCode } = req.params;
//   try {
//     // Retrieve the stall record.
//     const [stallRows] = await db.query("SELECT rooms FROM stalls WHERE stallCode = ?", [stallCode]);
//     if (stallRows.length === 0) {
//       return res.status(404).json({ error: 'Stall not found' });
//     }
//     // Use helper to safely parse rooms.
//     let roomsArr = parseRoomsValue(stallRows[0].rooms);
//     res.status(200).json(roomsArr);
//   } catch (err) {
//     console.error("Error fetching rooms:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };



const db = require('../db/connection');

// Create a new stall
exports.createStall = async (req, res) => {
  const { stallCode, building_id,floorsize } = req.body;

  if (!stallCode || !building_id || !floorsize) {
    return res.status(400).json({ error: 'Both stallCode and building_id are required' });
  }

  const queryInsert = "INSERT INTO stalls (stallCode, building_id, floorsize) VALUES (?, ?, ?)";
  try {
    const [result] = await db.query(queryInsert, [stallCode, building_id,floorsize]);
    return res.status(201).json({ message: 'Stall created successfully', id: result.insertId });
  } catch (err) {
    console.error("Error creating stall:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Retrieve all stalls
exports.getStalls = async (req, res) => {
  const query = "SELECT * FROM stalls";
  try {
    const [results] = await db.query(query);
    return res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching stalls:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update stall details (for example, stallCode and building_id)
exports.updateStallDetails = async (req, res) => {
  const stallId = req.params.stallId;
  const { stallCode, building_id } = req.body;

  const query = "UPDATE stalls SET stallCode = ?, building_id = ? WHERE id = ?";
  try {
    const [result] = await db.query(query, [stallCode, building_id, stallId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Stall not found' });
    }
    return res.status(200).json({ message: 'Stall updated successfully' });
  } catch (err) {
    console.error("Error updating stall:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a stall
exports.deleteStall = async (req, res) => {
  const stallId = req.params.stallId;
  const query = "DELETE FROM stalls WHERE id = ?";
  try {
    const [result] = await db.query(query, [stallId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Stall not found' });
    }
    return res.status(200).json({ message: 'Stall deleted successfully' });
  } catch (err) {
    console.error("Error deleting stall:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* --- ROOM CONTROLLER FUNCTIONS (using the separate 'rooms' table) --- */

// Create a new room for a stall
exports.createRoom = async (req, res) => {
  const stallId = req.params.stallId;
  const { roomName, size, monthlyRent, eeuReader } = req.body;

  try {
    // Verify that the stall exists.
    const [stallRows] = await db.query("SELECT * FROM stalls WHERE id = ?", [stallId]);
    if (stallRows.length === 0) {
      return res.status(404).json({ error: "Stall not found" });
    }

    // Insert a new room entry linked to the stall.
    const query = "INSERT INTO rooms (stall_id, roomName, size, monthlyRent, eeuReader) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [stallId, roomName, size, monthlyRent, eeuReader]);
    return res.status(201).json({ message: "Room created successfully", roomId: result.insertId });
  } catch (err) {
    console.error("Error creating room:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Retrieve all rooms for a specific stall
exports.getRooms = async (req, res) => {
  const stallId = req.params.stallId;
  try {
    // Optional: Verify that the stall exists.
    const [stallRows] = await db.query("SELECT * FROM stalls WHERE id = ?", [stallId]);
    if (stallRows.length === 0) {
      return res.status(404).json({ error: "Stall not found" });
    }

    const query = "SELECT * FROM rooms WHERE stall_id = ?";
    const [rooms] = await db.query(query, [stallId]);
    return res.status(200).json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.getRooms = async (req, res) => {
  try {
    const rooms = await db.query('SELECT * FROM rooms'); // Adjust this query based on your database schema
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// controllers/stallController.js

// ... (other code)


exports.updateRoom = async (req, res) => {
  const { stallId, roomId } = req.params;
  const { roomName, size, monthlyRent, eeuReader, status } = req.body;

  try {
      // Validate that the stall exists
      const [stallRows] = await db.query("SELECT * FROM stalls WHERE id = ?", [stallId]);
      if (stallRows.length === 0) {
          return res.status(404).json({ error: "Stall not found" });
      }

      // Validate that the room exists and belongs to the stall
      const [roomRows] = await db.query("SELECT * FROM rooms WHERE id = ? AND stall_id = ?", [roomId, stallId]);
      if (roomRows.length === 0) {
          return res.status(404).json({ error: "Room not found or does not belong to the specified stall" });
      }

      const query = `UPDATE rooms SET roomName = ?, size = ?, monthlyRent = ?, eeuReader = ?, status = ? WHERE id = ?`;
      const values = [roomName, size, monthlyRent, eeuReader, status, roomId];

      await db.query(query, values);
      return res.status(200).json({ message: "Room updated successfully" });
  } catch (err) {
      console.error("Error updating room:", err);
      return res.status(500).json({ error: "Internal server error" });
  }
};