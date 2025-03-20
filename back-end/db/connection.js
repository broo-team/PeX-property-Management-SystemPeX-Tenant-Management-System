const mysql = require('mysql2/promise');

console.log('Starting the database connection test...');  // Check if the file is being executed

const db = mysql.createPool({
    host: 'localhost',
    user: 'erp_db',
    password: '1234567',
    database: 'erp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Immediately test the connection and log the status
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to the database');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1); // Exit if the database fails to connect
    }
})();

// Export the database connection
module.exports = db;
