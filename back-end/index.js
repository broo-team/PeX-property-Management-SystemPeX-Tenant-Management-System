const express = require('express');
const app = express();
const cron = require("node-cron");
const dotenv = require("dotenv").config()
const  {terminateNewTenants}  = require("./controller/rentController");

const buildingRoutes = require('./routes/buildingRoutes');
const stallRoutes = require('./routes/stallRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const utilityRoutes = require("./routes/utilityRoutes")
const RentRoute = require("./routes/rentRoutes");
const usersRouter = require("./routes/users")
const login = require("./routes/loginRoute")
const maintenanceRoutes = require("./routes/maintenance")
const tenantsRoutes = require('./routes/tenantLoginRoutes');
const paymentRoutes = require("./routes/paymentRoutes")
const cors = require("cors")
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount our API routes
app.use(login)
app.use(tenantsRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/stalls', stallRoutes);
app.use('/api/utilities', utilityRoutes);
app.use(`/api/rent`,RentRoute)
app.use("/api/users", usersRouter);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentRoutes);


// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the Tenant Management API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// Example with node-cron in your main server file (app.js / server.js)

cron.schedule("*/15 * * * *", async () => {
  try {
    await terminateNewTenants({ /* req-like object if needed */ }, {
      json: (data) => {
        console.log("Tenant termination result:", data);
      },
      status: () => ({ json: () => {} }),
    });
  } catch (error) {
    console.error("Error in scheduled tenant termination:", error);
  }
});

// const express = require('express');
// const app = express();
// const cron = require("node-cron");
// const { terminateNewTenants } = require("./controller/rentController");

// const buildingRoutes = require('./routes/buildingRoutes');
// const stallRoutes = require('./routes/stallRoutes');
// const tenantRoutes = require('./routes/tenantRoutes');
// const utilityRoutes = require("./routes/utilityRoutes");
// const RentRoute = require("./routes/rentRoutes");
// const usersRouter = require("./routes/users");
// const login = require("./routes/loginRoute");
// const maintenanceRoutes = require("./routes/maintenance");
// const tenantsRoutes = require('./routes/tenantLoginRoutes');

// const cors = require("cors");
// const bodyParser = require('body-parser'); // Import body-parser
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json()); // Add body-parser middleware

// // Mount our API routes
// app.use('/api/buildings', buildingRoutes);
// app.use('/api/tenants', tenantRoutes);
// app.use('/stalls', stallRoutes);
// app.use('/api/utilities', utilityRoutes);
// app.use(`/api/rent`, RentRoute);
// app.use("/api/users", usersRouter);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use(login);
// app.use(tenantsRoutes);

// // Chapa Callback Endpoint
// app.post('/chapa-callback', (req, res) => {
//     try {
//         const callbackData = req.body;
//         console.log('Chapa Callback Data:', callbackData);

//         // Process the callback data here
//         // Example: Update your database with the transaction status
//         // Example: Send an email notification to the user

//         // Important: Send a 200 OK response to Chapa
//         res.sendStatus(200);
//     } catch (error) {
//         console.error('Error processing Chapa callback:', error);
//         res.sendStatus(500); // Internal server error
//     }
// });

// // A simple test route
// app.get('/', (req, res) => {
//     res.send('Welcome to the Tenant Management API');
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// // Example with node-cron in your main server file (app.js / server.js)
// cron.schedule("*/15 * * * *", async () => {
//     try {
//         await terminateNewTenants({ /* req-like object if needed */ }, {
//             json: (data) => {
//                 console.log("Tenant termination result:", data);
//             },
//             status: () => ({ json: () => { } }),
//         });
//     } catch (error) {
//         console.error("Error in scheduled tenant termination:", error);
//     }
// });