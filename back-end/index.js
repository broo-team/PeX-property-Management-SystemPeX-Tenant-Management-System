const express = require('express');
const app = express();

const buildingRoutes = require('./routes/buildingRoutes');
const stallRoutes = require('./routes/stallRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const utilityRoutes = require("./routes/utilityRoutes")
const RentRoute = require("./routes/rentRoutes");

const cors = require("cors")
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount our API routes
app.use('/api/buildings', buildingRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/stalls', stallRoutes);
app.use('/api/utilities', utilityRoutes);
app.use(`/api/rent`,RentRoute)
// A simple test route
app.get('/', (req, res) => {
  res.send('Welcome to the Tenant Management API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
