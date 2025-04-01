// controllers/tenantAuthController.js
const db = require("../db/connection");
const jwt = require("jsonwebtoken");

exports.tenantLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("Tenant login request body:", req.body);

    // Validate that phone and password are provided
    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone number and password are required.",
      });
    }

    // Query the tenants table for a tenant with the provided phone
    let [tenantRows] = await db.query("SELECT * FROM tenants WHERE phone = ?", [phone]);
    if (tenantRows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }
    const tenant = tenantRows[0];

    // Perform a plain text password comparison
    if (tenant.password !== password) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    // Fetch associated building info using the tenant's building_id
    let [buildingRows] = await db.query("SELECT * FROM buildings WHERE id = ?", [tenant.building_id]);
    let buildingInfo = buildingRows.length > 0 ? buildingRows[0] : null;
    // Remove sensitive info from building details
    if (buildingInfo) {
      const { owner_phone, password, ...safeBuilding } = buildingInfo;
      buildingInfo = safeBuilding;
    }

    // Retrieve additional tenant info: roomName from rooms table and stallCode from stalls table
    let roomName = null;
    let stallCode = null;
    const roomId = parseInt(tenant.room, 10);
    if (!isNaN(roomId)) {
      const [roomRows] = await db.query("SELECT * FROM rooms WHERE id = ?", [roomId]);
      if (roomRows.length > 0) {
        roomName = roomRows[0].roomName;
        const roomStallId = roomRows[0].stall_id;
        if (roomStallId) {
          const [stallRows] = await db.query("SELECT * FROM stalls WHERE id = ?", [roomStallId]);
          if (stallRows.length > 0) {
            stallCode = stallRows[0].stallCode;
          }
        }
      }
    }

    // Create a payload for the JWT
    const payload = {
      id: tenant.id,              // Auto-generated primary key
      tenant_id: tenant.tenant_id, // Tenant-ID provided during registration
      building_id: tenant.building_id,
      phone: tenant.phone
    };

    // Secret key for signing the token
    const secretKey = process.env.JWT_SECRET || 'your-default-secret-here';

    // Generate a JWT token; expires in 1 hour
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    // Prepare tenant data for the response (without sensitive data)
    const safeTenant = {
      id: tenant.id,
      tenant_id: tenant.tenant_id,
      full_name: tenant.full_name,
      phone: tenant.phone,
      building_id: tenant.building_id,
      roomName: roomName,    // Room name from the rooms table
      stallCode: stallCode   // Stall code from the stalls table
    };

    console.log("Tenant authenticated:", safeTenant);
    return res.json({
      message: "Tenant login successful.",
      type: "tenant",
      token: token,
      tenant: safeTenant,
      building: buildingInfo,
    });
  } catch (error) {
    console.error("Tenant authentication error:", error);
    return res.status(500).json({
      message: "Server error during tenant authentication.",
    });
  }
};

// https://copilot.microsoft.com/chats/WwBJ8SDisn2LPToDrLe7G