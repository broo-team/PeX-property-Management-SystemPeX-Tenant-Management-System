// controllers/tenantController.js
const db = require('../db/connection');


exports.createTenant = async (req, res) => {
  console.log("REQUEST BODY:", req.body);

  const {
    tenantID,
    fullName,
    sex,
    phone,
    city,
    subcity,
    woreda,
    house_no,
    room, // room id selected by the tenant
    price,
    paymentTerm,
    deposit,
    rentStart,
    rentEnd,
    lease_start, // lease start date
    lease_end,   // lease end date
    eeuPayment,
    generatorPayment,
    waterPayment,
    registeredByAgent,
    authenticationNo,
    agentFirstName,
    agentSex,
    agentPhone,
    agentCity,
    agentSubcity,
    agentWoreda,
    agentHouseNo,
    building_id
  } = req.body;

  // Validate required fields.
  if (
    !tenantID ||
    !fullName ||
    !sex ||
    !phone ||
    !room ||
    !lease_start ||
    !lease_end ||
    !building_id ||
    !rentStart ||
    !rentEnd
  ) {
    return res.status(400).json({
      error:
        'Missing required fields. Ensure tenantID, fullName, sex, phone, room, lease_start, lease_end, building_id, rentStart, and rentEnd are provided.'
    });
  }

  try {
    // 1. Check the availability of the room using the status column.
    const roomQuery = "SELECT status FROM rooms WHERE id = ?";
    const [rooms] = await db.query(roomQuery, [room]);
    console.log("ROOM Query Result:", rooms);

    if (rooms.length === 0) {
      return res.status(404).json({ error: "Room not found." });
    }

    // Assuming the room is available if status is not "taken"
    if (rooms[0].status && rooms[0].status.toLowerCase() === "taken") {
      return res.status(400).json({ error: "Room is already occupied." });
    }

    // 2. Insert the tenant record into the tenants table.
    const tenantInsertQuery = `
      INSERT INTO tenants 
        (tenant_id, full_name, sex, phone, city, subcity, woreda, house_no, room, price, payment_term, deposit, lease_start, lease_end, registered_by_agent, authentication_no, agent_first_name, agent_sex, agent_phone, agent_city, agent_subcity, agent_woreda, agent_house_no, rent_start_date, rent_end_date, eeu_payment, generator_payment, water_payment, building_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const tenantValues = [
      tenantID,
      fullName,
      sex,
      phone,
      city || null,
      subcity || null,
      woreda || null,
      house_no || null,
      room,
      price || null,
      paymentTerm || null,
      deposit,
      lease_start,
      lease_end,
      registeredByAgent || false,
      authenticationNo || null,
      agentFirstName || null,
      agentSex || null,
      agentPhone || null,
      agentCity || null,
      agentSubcity || null,
      agentWoreda || null,
      agentHouseNo || null,
      rentStart || null,
      rentEnd || null,
      eeuPayment || false,
      generatorPayment || false,
      waterPayment || false,
      building_id
    ];

    const [tenantResult] = await db.query(tenantInsertQuery, tenantValues);
    console.log("Tenant Insert Result:", tenantResult);
    const newTenantId = tenantResult.insertId;

    // 3. Update the room's record to mark it as occupied.
    const updateRoomQuery = "UPDATE rooms SET status = ? WHERE id = ?";
    const [roomUpdateResult] = await db.query(updateRoomQuery, ["taken", room]);
    console.log("Room Update Result:", roomUpdateResult);

    return res.status(201).json({
      message: "Tenant created successfully and room marked as 'taken'.",
      id: newTenantId
    });
  } catch (err) {
    console.error("Error in createTenant:", err);
    return res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

exports.getTenants = async (req, res) => {
  // Use backticks around terminated.
  const query = "SELECT * FROM tenants WHERE `terminated` = false";
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching tenants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTenantById = async (req, res) => {
  const tenantId = req.params.id; // uses the URL parameter
  const query = "SELECT * FROM tenants WHERE id = ?";
  try {
    const [results] = await db.query(query, [tenantId]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching tenant by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTenant = async (req, res) => {
  const tenantId = req.params.id;
  const {
      tenantID,
      fullName,
      sex,
      phone,
      city,
      subcity,
      woreda,
      house_no,
      room,
      price,
      paymentTerm,
      deposit,
      lease_start, // Changed from leasePeriod
      lease_end,   // Changed from leasePeriod
      rentStart,
      rentEnd,
      eeuPayment,
      generatorPayment,
      waterPayment,
      registeredByAgent,
      authenticationNo,
      agentFirstName,
      agentSex,
      agentPhone,
      agentCity,
      agentSubcity,
      agentWoreda,
      agentHouseNo,
      building_id
  } = req.body;

  // Removed leasePeriod array validation

  const query = `
      UPDATE tenants 
          SET tenant_id = ?, full_name = ?, sex = ?, phone = ?, city = ?, subcity = ?, woreda = ?, house_no = ?, room = ?, price = ?, payment_term = ?, deposit = ?, lease_start = ?, lease_end = ?, registered_by_agent = ?, authentication_no = ?, agent_first_name = ?, agent_sex = ?, agent_phone = ?, agent_city = ?, agent_subcity = ?, agent_woreda = ?, agent_house_no = ?, eeu_payment = ?, generator_payment = ?, water_payment = ?, building_id = ?
      WHERE id = ?
  `;
  // const values = [
  //     tenantID,
  //     fullName,
  //     sex,
  //     phone,
  //     city,
  //     subcity,
  //     woreda,
  //     house_no,
  //     room,
  //     price,
  //     paymentTerm,
  //     deposit,
  //     lease_start, // Changed from leaseStart
  //     lease_end,   // Changed from leaseEnd
  //     registeredByAgent,
  //     authenticationNo,
  //     agentFirstName,
  //     agentSex,
  //     agentPhone,
  //     agentCity,
  //     agentSubcity,
  //     agentWoreda,
  //     agentHouseNo,
  //     rentStart,
  //     rentEnd,
  //     eeuPayment,
  //     generatorPayment,
  //     waterPayment,
  //     building_id,
  //     tenantId
  // ];
  const values = [
    tenantID,
    fullName,
    sex,
    phone,
    city,
    subcity,
    woreda,
    house_no,
    room,
    price,
    paymentTerm,
    deposit,
    lease_start,
    lease_end,
    registeredByAgent,
    authenticationNo,
    agentFirstName,
    agentSex,
    agentPhone,
    agentCity,
    agentSubcity,
    agentWoreda,
    agentHouseNo,
    eeuPayment,
    generatorPayment,
    waterPayment,
    building_id,
    tenantId
];
  try {
      const [result] = await db.query(query, values);
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Tenant not found' });
      }
      res.status(200).json({ message: 'Tenant updated successfully' });
  } catch (err) {
      console.error('Error updating tenant:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
};
exports.terminateTenant = async (req, res) => {
  const tenantId = req.params.id;
  
  try {
    // 1. Retrieve the tenant record to get the associated room id.
    const tenantQuery = "SELECT room FROM tenants WHERE id = ?";
    const [tenantRows] = await db.query(tenantQuery, [tenantId]);
    
    if (tenantRows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const roomId = tenantRows[0].room;
    
    // 2. Mark the tenant as terminated.
    const updateTenantQuery = `UPDATE tenants SET \`terminated\` = true WHERE id = ?`;
    const [tenantResult] = await db.query(updateTenantQuery, [tenantId]);
    
    if (tenantResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Tenant not found during update.' });
    }
    
    // 3. Update the room's status to "available" so it can be re-assigned.
    if (roomId) {
      const updateRoomQuery = "UPDATE rooms SET status = ? WHERE id = ?";
      await db.query(updateRoomQuery, ["available", roomId]);
    }
    
    res.status(200).json({
      message: 'Tenant terminated successfully and room marked as available.'
    });
  } catch (err) {
    console.error('Error terminating tenant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTerminatedTenants = async (req, res) => {
  const query = "SELECT * FROM tenants WHERE `terminated` = true";
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching terminated tenants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// exports.getTenants = async (req, res) => {
//   try {
//     const query = `
//       SELECT
//         tenant.id,
//         tenant.tenant_id,
//         tenant.full_name,
//         tenant.sex,
//         tenant.phone,
//         tenant.city,
//         tenant.subcity,
//         tenant.woreda,
//         tenant.house_no,
//         tenant.room,
//         tenant.price,
//         tenant.payment_term,
//         tenant.deposit,
//         tenant.lease_start,
//         tenant.lease_end,
//         tenant.registered_by_agent,
//         tenant.authentication_no,
//         tenant.agent_first_name,
//         tenant.agent_sex,
//         tenant.agent_phone,
//         tenant.agent_city,
//         tenant.agent_subcity,
//         tenant.agent_woreda,
//         tenant.agent_house_no,
//         tenant.eeu_payment,
//         tenant.generator_payment,
//         tenant.water_payment,
//         tenant.terminated,
//         tenant.building_id,
//         tenant.created_at,
//         tenant.rent_start_date,
//         tenant.rent_end_date,
//         tenant.password,
//         IFNULL(rooms.monthlyRent, 0) AS monthlyRent,
//         IFNULL(electricity.last_reading, 0) AS last_eeu_reading,
//         IFNULL(water_usage.last_reading, 0) AS last_water_reading,
//         IFNULL(generator_usage.last_reading, 0) AS last_generator_reading
//       FROM tenants tenant
//       LEFT JOIN rooms rooms
//         ON tenant.room = rooms.id
//       LEFT JOIN (
//         SELECT tenant_id, MAX(current_reading) AS last_reading
//         FROM tenant_utility_usage
//         WHERE utility_type = 'electricity'
//         GROUP BY tenant_id
//       ) electricity ON tenant.id = electricity.tenant_id
//       LEFT JOIN (
//         SELECT tenant_id, MAX(current_reading) AS last_reading
//         FROM tenant_utility_usage
//         WHERE utility_type = 'water'
//         GROUP BY tenant_id
//       ) water_usage ON tenant.id = water_usage.tenant_id
//       LEFT JOIN (
//         SELECT tenant_id, MAX(current_reading) AS last_reading
//         FROM tenant_utility_usage
//         WHERE utility_type = 'generator'
//         GROUP BY tenant_id
//       ) generator_usage ON tenant.id = generator_usage.tenant_id;
//     `;
//     const [results] = await db.query(query);

//     // Console Log Query Results
//     console.log("Database Query Results:", results);

//     // Verify Data Types and values
//     results.forEach((row) => {
//         console.log(`Tenant ID: ${row.id}`);
//         console.log(`tenant.room: ${row.room}, type: ${typeof row.room}`);
//         console.log(`rooms.id: ${row.id}, type: ${typeof row.id}`);
//     })

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching tenants:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getTenants = async (req, res) => {
  try {
    const query = `
      SELECT
        tenant.id,
        tenant.tenant_id,
        tenant.full_name,
        tenant.sex,
        tenant.phone,
        tenant.city,
        tenant.subcity,
        tenant.woreda,
        tenant.house_no,
        tenant.room,
        tenant.price,
        tenant.payment_term,
        tenant.deposit,
        tenant.lease_start,
        tenant.lease_end,
        tenant.registered_by_agent,
        tenant.authentication_no,
        tenant.agent_first_name,
        tenant.agent_sex,
        tenant.agent_phone,
        tenant.agent_city,
        tenant.agent_subcity,
        tenant.agent_woreda,
        tenant.agent_house_no,
        tenant.eeu_payment,
        tenant.generator_payment,
        tenant.water_payment,
        tenant.terminated,
        tenant.building_id,
        tenant.created_at,
        tenant.rent_start_date,
        tenant.rent_end_date,
        tenant.password,
        rooms.roomName AS roomName,
        IFNULL(rooms.monthlyRent, 0) AS monthlyRent,
        IFNULL(electricity.last_reading, 0) AS last_eeu_reading,
        IFNULL(water_usage.last_reading, 0) AS last_water_reading,
        IFNULL(generator_usage.last_reading, 0) AS last_generator_reading
      FROM tenants tenant
      LEFT JOIN rooms rooms
        ON tenant.room = rooms.id
      LEFT JOIN (
        SELECT tenant_id, MAX(current_reading) AS last_reading
        FROM tenant_utility_usage
        WHERE utility_type = 'electricity'
        GROUP BY tenant_id
      ) electricity ON tenant.id = electricity.tenant_id
      LEFT JOIN (
        SELECT tenant_id, MAX(current_reading) AS last_reading
        FROM tenant_utility_usage
        WHERE utility_type = 'water'
        GROUP BY tenant_id
      ) water_usage ON tenant.id = water_usage.tenant_id
      LEFT JOIN (
        SELECT tenant_id, MAX(current_reading) AS last_reading
        FROM tenant_utility_usage
        WHERE utility_type = 'generator'
        GROUP BY tenant_id
      ) generator_usage ON tenant.id = generator_usage.tenant_id;
    `;

    const [results] = await db.query(query);

    // Log query results for debugging
    results.forEach((row) => {
      console.log(`Tenant ID: ${row.id}`);
      console.log(`Tenant room (ID): ${row.room}, Room Name: ${row.roomName}`);
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
