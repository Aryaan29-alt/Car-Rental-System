const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db'); // Our db.js file (should point to localhost)
const cors = require('cors');
// Removed require('dotenv').config();

const app = express();
const PORT = 3000; // Use fixed port 3000 for local dev
const saltRounds = 10;

// --- MIDDLEWARE ---
app.use(cors()); // Keep CORS for local development ease
app.use(express.json()); // Middleware to parse JSON request bodies

// --- Basic Root Route (Optional but harmless) ---
app.get('/', (req, res) => {
  res.status(200).send('Car Rental API is running locally!');
});

// --- DEFINE API ROUTER ---
const apiRouter = express.Router(); // Create a new router instance

// --- MOUNT API ROUTES onto apiRouter ---

// --- CUSTOMER AND AUTHENTICATION ENDPOINTS ---
apiRouter.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, license, password } = req.body;
  if (!email || !password || !first_name || !license) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  try {
    const password_hash = await bcrypt.hash(password, saltRounds);
    const sqlQuery = `INSERT INTO Customers (first_name, last_name, email, phone_number, driver_license_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(sqlQuery, [first_name, last_name, email, phone, license, password_hash]);
    res.status(201).json({ message: "Customer registered successfully!" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Email already in use." });
    }
    console.error("Database error during registration:", error);
    res.status(500).json({ message: "Error registering customer." });
  }
});

apiRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  try {
    const sqlQuery = "SELECT customer_id, first_name, password_hash FROM Customers WHERE email = ?";
    const [users] = await db.query(sqlQuery, [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      res.status(200).json({
        message: "Login successful!",
        customer_id: user.customer_id,
        first_name: user.first_name
      });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Database error during login:", error);
    res.status(500).json({ message: "Error during login." });
  }
});

// --- CARS ENDPOINTS ---
apiRouter.get('/cars', async (req, res) => { // GET /api/cars (Available for Customers)
  try {
    const sqlQuery = "SELECT * FROM Cars WHERE status = 'Available'";
    const [cars] = await db.query(sqlQuery);
    res.status(200).json(cars);
  } catch (error) {
    console.error("Database error fetching available cars:", error);
    res.status(500).json({ message: "Error fetching available cars." });
  }
});

apiRouter.get('/cars/all', async (req, res) => { // GET /api/cars/all (All for Admin)
  try {
    const sqlQuery = "SELECT * FROM Cars ORDER BY car_id";
    const [cars] = await db.query(sqlQuery);
    res.status(200).json(cars);
  } catch (error) {
    console.error("Database error fetching all cars:", error);
    res.status(500).json({ message: "Error fetching all cars." });
  }
});

apiRouter.get('/cars/:carId', async (req, res) => { // GET /api/cars/:carId (Single Car)
  const { carId } = req.params;
  try {
    const sqlQuery = "SELECT * FROM Cars WHERE car_id = ?";
    const [cars] = await db.query(sqlQuery, [carId]);
    if (cars.length === 0) {
      return res.status(404).json({ message: "Car not found." });
    }
    res.status(200).json(cars[0]);
  } catch (error) {
    console.error(`Database error fetching car ID ${carId}:`, error);
    res.status(500).json({ message: "Error fetching car details." });
  }
});

apiRouter.post('/cars', async (req, res) => { // POST /api/cars (Add Car - Admin)
  const { make, model, year, license_plate, daily_rate, location_id, status } = req.body;
  if (!make || !model || !license_plate || !daily_rate) {
    return res.status(400).json({ message: "Missing required fields for car." });
  }
  try {
    const sqlQuery = `INSERT INTO Cars (make, model, year, license_plate, daily_rate, location_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db.query(sqlQuery, [make, model, year, license_plate, daily_rate, location_id || null, status || 'Available']);
    res.status(201).json({ message: "Car added successfully!" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "License plate already exists." });
    }
    console.error("Database error adding car:", error);
    res.status(500).json({ message: "Error adding car." });
  }
});

apiRouter.put('/cars/:carId', async (req, res) => { // PUT /api/cars/:carId (Update Car - Admin)
  const { carId } = req.params;
  const { daily_rate, status, location_id } = req.body;
  if (!daily_rate || !status) {
    return res.status(400).json({ message: "Missing required fields for update (daily_rate, status)." });
  }
  const allowedStatuses = ['Available', 'Rented', 'Maintenance'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value provided." });
  }
  try {
    const sqlQuery = `UPDATE Cars SET daily_rate = ?, status = ?, location_id = ? WHERE car_id = ?`;
    const [result] = await db.query(sqlQuery, [daily_rate, status, location_id || null, carId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Car not found or no changes made." });
    }
    res.status(200).json({ message: "Car updated successfully." });
  } catch (error) {
    console.error(`Database error updating car ID ${carId}:`, error);
    res.status(500).json({ message: "Error updating car." });
  }
});

// --- RESERVATIONS ENDPOINTS ---
apiRouter.post('/reservations', async (req, res) => { // POST /api/reservations (Create Reservation)
  const { customer_id, car_id, start_date, end_date } = req.body;
  if (!customer_id || !car_id || !start_date || !end_date) {
    return res.status(400).json({ message: "Missing required fields for reservation." });
  }
  try {
    await db.query('START TRANSACTION');
    const carQuery = "SELECT daily_rate, status FROM Cars WHERE car_id = ? FOR UPDATE";
    const [cars] = await db.query(carQuery, [car_id]);
    if (cars.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: "Car not found." });
    }
    if (cars[0].status !== 'Available') {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: "Car is not available for rent." });
    }
    const dailyRate = cars[0].daily_rate;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const durationInMs = endDate.getTime() - startDate.getTime();
     if (durationInMs < 0) { // Check if end date is before start date
         await db.query('ROLLBACK');
         return res.status(400).json({ message: "End date cannot be before start date." });
    }
    // Calculate days inclusive: Add 1 day worth of milliseconds before dividing
    const durationInDays = Math.ceil((durationInMs + (1000 * 60 * 60 * 24)) / (1000 * 60 * 60 * 24));

    if(durationInDays <= 0) { // Safety check
      await db.query('ROLLBACK');
      return res.status(400).json({ message: "End date must be on or after start date." });
    }
    const totalCost = durationInDays * dailyRate;
    const reservationQuery = `INSERT INTO Reservations (customer_id, car_id, start_date, end_date, total_cost, status) VALUES (?, ?, ?, ?, ?, 'Confirmed')`;
    await db.query(reservationQuery, [customer_id, car_id, start_date, end_date, totalCost]);
    const updateCarQuery = "UPDATE Cars SET status = 'Rented' WHERE car_id = ?";
    await db.query(updateCarQuery, [car_id]);
    await db.query('COMMIT');
    res.status(201).json({ message: "Reservation created successfully!" });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Database Error creating reservation:", error);
     if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('customer_id')) {
         return res.status(404).json({ message: "Customer ID not found." });
    }
    res.status(500).json({ message: "Error creating reservation." });
  }
});

apiRouter.get('/reservations', async (req, res) => { // GET /api/reservations (All Reservations - Admin)
  try {
    const sqlQuery = `SELECT r.reservation_id, r.start_date, r.end_date, r.total_cost, r.status, c.make, c.model, cust.first_name, cust.last_name FROM Reservations r JOIN Cars c ON r.car_id = c.car_id JOIN Customers cust ON r.customer_id = cust.customer_id ORDER BY r.start_date DESC`;
    const [reservations] = await db.query(sqlQuery);
    res.status(200).json(reservations);
  } catch (error) {
    console.error("Database error fetching reservations:", error);
    res.status(500).json({ message: "Error fetching reservations." });
  }
});

// --- TELL EXPRESS TO USE THE API ROUTER FOR ALL /api PATHS ---
app.use('/api', apiRouter); // Mount the router at the /api prefix

// --- START THE SERVER ---
// Listen only on localhost for local development
app.listen(PORT, () => {
  console.log(`Server is running locally on http://localhost:${PORT}`);
});