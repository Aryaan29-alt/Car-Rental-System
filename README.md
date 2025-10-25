# car-rental-system
A DBMS Car Rental System Project
This project is a simple web application for managing rental cars, customers, and reservations, built using Node.js, Express.js, and a MySQL database. It features separate interfaces for customers and administrators.

Team Members

Devarshi Guchhait   -   12023052018068
Aryan Tiwary        -   12023052018040
Sonu Kumar          -   12023052018075

Features

Customer Portal (customer_frontend/index.html):

User Registration (with password hashing)

User Login

View list of currently available cars with details and pricing.

Select dates and book an available car.

Logout functionality.

Admin Dashboard (admin_frontend/index.html):

Add new cars to the fleet, specifying make, model, year, license plate, rate, and initial status.

Update existing car details (specifically daily rate and status) using the Car ID.

View a list of all cars in the fleet, showing their ID, details, rate, and current status (Available, Rented, Maintenance).

View a list of all reservations made, showing reservation ID, customer name, car details, dates, total cost, and reservation status.

Forms provide feedback on success or failure.

Lists automatically refresh after adding/updating cars or manually via refresh buttons.

Backend API (server.js):

Provides RESTful API endpoints (/api/...) for all frontend operations.

Handles password hashing during registration (bcrypt).

Manages all database interactions with MySQL (mysql2).

Includes basic input validation and error handling.

Uses CORS to allow communication between the locally served frontend and backend.

Implements basic transaction handling for creating reservations to ensure data consistency.

Technology Stack

Backend: Node.js, Express.js

Database: MySQL

Frontend: HTML, CSS, JavaScript (using Fetch API for AJAX requests)

Node Packages: express, mysql2, bcrypt, cors


Prerequisites for Local Setup

Before running this project, you need to have the following installed on your machine:

Node.js: Version 18 or later is recommended. Download from nodejs.org. Verify installation by running node -v and npm -v in your terminal.

MySQL Server: Version 8.0 recommended. Download the Community Server from [suspicious link removed]. During installation, set a root password and remember it. Ensure the MySQL server service is running.

MySQL Client: A tool to interact with your database is needed to create the schema. Options include:

MySQL Workbench: Recommended graphical tool. Download from dev.mysql.com/downloads/workbench/.

MySQL Command Line Client: Usually installed with the server.

Other tools like HeidiSQL, DBeaver, etc.

Git: (Optional, if cloning the repository) Download from git-scm.com.

Local Setup and Running Instructions

Follow these steps precisely to set up and run the application on your local machine:

1. Get the Code:

Option A (Git Clone):
Open your terminal or command prompt and run:

git clone [https://github.com/Devar19/car-rental-system.git](https://github.com/Devar19/car-rental-system.git)
cd car-rental-system


Option B (Download ZIP):
Download the project code as a ZIP file from the GitHub repository page (Code -> Download ZIP). Extract the contents. Open your terminal/command prompt and navigate into the extracted car-rental-system-main folder using the cd command.

2. Install Dependencies:
Once your terminal is inside the project folder (car-rental-system), run the following command to download all the necessary Node.js packages listed in package.json:

npm install


(This will create a node_modules folder. You might see warnings during installation, which can usually be ignored unless they are critical errors.)

3. Set up MySQL Database:

Log in to your MySQL server using your chosen client (e.g., MySQL Workbench).

Execute the following SQL commands to create the database and the required tables:

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS car_rental_db;

-- Switch to the newly created database
USE car_rental_db;

-- Create Locations table (Optional, but helps maintain relationships)
CREATE TABLE IF NOT EXISTS Locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20)
);

-- Create Cars table
CREATE TABLE IF NOT EXISTS Cars (
    car_id INT AUTO_INCREMENT PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('Available', 'Rented', 'Maintenance') DEFAULT 'Available', -- Note: Capitalized Enums
    daily_rate DECIMAL(10, 2) NOT NULL,
    location_id INT,
    FOREIGN KEY (location_id) REFERENCES Locations(location_id) ON DELETE SET NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    driver_license_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(60) NOT NULL
);

-- Create Reservations table
CREATE TABLE IF NOT EXISTS Reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    car_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10, 2),
    status ENUM('Confirmed', 'Completed', 'Cancelled') DEFAULT 'Confirmed', -- Note: Capitalized Enums
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id) ON DELETE SET NULL
);

-- Create Payments table (Optional feature, included for completeness)
CREATE TABLE IF NOT EXISTS Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'Credit Card',
    transaction_id VARCHAR(100),
    FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id) ON DELETE SET NULL
);


Verify the tables were created successfully (e.g., by running SHOW TABLES; or checking the schema browser in Workbench).

Configure Database Connection:

Open the db.js file located in the project's root directory using a text editor.

IMPORTANT: Locate the line:

password: 'YOUR_LOCAL_MYSQL_PASSWORD', // Please change this


Replace 'YOUR_LOCAL_MYSQL_PASSWORD' with the actual password you set for your local MySQL root user (or the specific user you configured).

Ensure the host ('localhost'), user ('root'), and database ('car_rental_db') fields match your local MySQL setup. The defaults are usually correct.

Save the db.js file.

5. Run the Backend Server:

Go back to your terminal (ensure you are still in the car-rental-system project folder).

Run the following command:

node server.js


The terminal should display the message: Server is running locally on http://localhost:3000

Leave this terminal window open. The backend server needs to keep running for the frontends to work.

6. Access the Frontend Applications:

Open your preferred web browser (e.g., Chrome, Firefox, Edge).

To use the Customer Portal:

Navigate to the customer_frontend folder within your project directory using your computer's file explorer.

Drag the index.html file from that folder directly into your browser window, or use the browser's File -> Open File menu option to open it.

The URL in your browser will start with file:///....

To use the Admin Dashboard:

Navigate to the admin_frontend folder within your project directory.

Open the index.html file from this folder in your browser (using drag-and-drop or File -> Open File).

You can now interact with both the customer and admin interfaces. They will communicate with the backend server running locally via http://localhost:3000/api.

Deployment Notes (Informational Only)

This project was successfully deployed using:

Backend API: Render (Free Tier) - https://car-rental-system-api-ls6b.onrender.com

Database: Railway (Starter Plan)

Frontend: Netlify (Free Tier) - Customer: https://carrentalsystemprojectcustomer.netlify.app, Admin: https://carrentalsystemprojectadmin.netlify.app

Note: The deployed Netlify frontend sites were temporarily paused shortly after deployment due to exceeding the platform's free tier usage limits for the month. The backend and database remain functional, but local execution is the recommended way to test the full application.