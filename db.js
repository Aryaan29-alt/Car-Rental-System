// Import the mysql2 library
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',      // database host
  user: 'root',           // MySQL username
  password: 'DBMSl@68', // MySQL password (please change this password for local device)
  database: 'car_rental_db', // The name of database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool's promise() function to use async/await syntax
module.exports = pool.promise();
