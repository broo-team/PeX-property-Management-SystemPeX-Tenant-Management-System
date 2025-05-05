const express = require('express');
const app = express();
const cron = require("node-cron");
const dotenv = require("dotenv").config()
const  {terminateNewTenants}  = require("./controller/rentController");
const ngrok = require('ngrok');
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
const userRoutes = require("./routes/userRoutes")
const creatorRoutes = require("./routes/creatorRoutes")
const cors = require("cors");
// const { bulkVerifyPayments } = require('./controller/paymentController');
const PORT = process.env.PORT || 5000;
app.use(cors());


app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8'); // Ensure proper encoding
  }
}));

app.use('/api/buildings', buildingRoutes);
app.use(login)
app.use(tenantsRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/stalls', stallRoutes);
app.use('/api/utilities', utilityRoutes);
app.use(`/api/rent`,RentRoute)
app.use("/api/users", usersRouter);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', userRoutes); 
app.use('/api/creators', creatorRoutes);
// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the Tenant Management API');
});

app.use('/uploads', express.static('uploads'));



app.listen(PORT,()=>{
  console.log(`the appis runniing on ${PORT}`)
})


cron.schedule(process.env.PAYMENT_RECONCILIATION_CRON || "0 12 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Running payment reconciliation job`);
  try {
    const { bulkVerifyPayments } = require('./controller/paymentController');
    
    // Create proper mock response
    const mockResponse = {
      json: (data) => console.log('Bulk verify result:', JSON.stringify(data, null, 2)),
      status: (code) => ({ 
        json: (data) => console.error(`Error ${code}:`, JSON.stringify(data, null, 2)) 
      })
    };

    // Simulate request object with necessary properties
    const mockRequest = {
      query: {},
      body: {}
    };

    await bulkVerifyPayments(mockRequest, mockResponse);
  } catch (error) {
    console.error("Payment reconciliation error:", error);
  }
});
