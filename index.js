require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise'); // Import MySQL module
const path = require('path');
const methodOverride = require('method-override');
const nodemailer = require('nodemailer'); // Import nodemailer for sending emails
const randomstring = require('randomstring'); // Import randomstring for generating OTPs

const app = express(); // Create Express app
app.listen(8000, () => {
    console.log("Server is running on port 8000");
});

// Configure template engine (EJS)
// Serve static files
app.use(methodOverride('_method'));
app.set("view engine", "ejs"); // Set EJS as the template engine
app.set("views", path.join(__dirname, "/views")); // Set views directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to create student_database table if not exists
async function createStudentDatabaseTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS student_database (
            ID INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            Age INT NOT NULL,
            Email VARCHAR(255) NOT NULL UNIQUE,
            Phone VARCHAR(20),
            RegistrationNumber VARCHAR(20),
            CollegeBatch VARCHAR(20),
            Password VARCHAR(255) NOT NULL
        )
    `; // Query to create table

    try {
        const [result] = await pool.query(createTableQuery);
        console.log("Table 'student_database' created or already exists");
    } catch (error) {
        console.error("Error creating 'student_database' table:", error);
    }
}

// Route for rendering login form
app.get('/login', (req, res) => {
    res.render("login.ejs");
});

// Route for rendering signup form
app.get('/signup', (req, res) => {
    res.render("signup.ejs");
});

// Route for handling signup form submission
app.post('/signup', async (req, res) => {
    let { name, email, phone, registrationNumber, collegeBatch, age, password } = req.body;

    // Checking if the email already exists or not
    const checkQuery = "SELECT * FROM student_database WHERE Email=?";

    try {
        const [result] = await pool.query(checkQuery, [email]);

        if (result.length === 0) {
            // If no record found in the database, then insert data into the table
            const insertQuery = `
                INSERT INTO student_database
                SET ?`;

            const userData = {
                Name: name,
                Age: age,
                Email: email,
                Phone: phone,
                RegistrationNumber: registrationNumber,
                CollegeBatch: collegeBatch,
                Password: password,
            };

            await pool.query(insertQuery, userData);

            return res.status(200).json({ message: "User successfully registered" });
        } else {
            return res.status(400).json({ error: "Email already exists" });
        }
    } catch (err) {
        console.error('MySQL Error:', err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route for handling login form submission
app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    // Check if the email and password match a user in the database
    const loginQuery = "SELECT * FROM student_database WHERE Email=? AND Password=?";

    try {
        const [result] = await pool.query(loginQuery, [email, password]);

        if (result.length === 1) {
            // Successful login
            return res.status(200).json({ message: "Login successful" });
        } else {
            // Invalid email or password
            return res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (err) {
        console.error('MySQL Error:', err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Temporary storage for OTP
const otpStorage = {};

// GET route for OTP verification
app.get('/verify_otp/:email', (req, res) => {
    const email = req.params.email;

    // Render the OTP verification page
    res.render("verify_otp.ejs", { email });
});

// POST route for OTP verification
app.post('/verify_otp/:email', async (req, res) => {
    const email = req.params.email;
    const otp = req.body.otp;

    if (otpStorage[email] === otp) {
        // OTP is valid, redirect to the password reset page
        res.redirect(`/reset_password/${encodeURIComponent(email)}`);
    } else {
        // Incorrect OTP
        res.status(401).json({ error: "Invalid OTP" });
    }
});

// Send an OTP to the given email address
// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Route for rendering forgot password form
app.get('/forgot_password', (req, res) => {
    res.render("forgot_password.ejs");
});

// Route for handling forgot password form submission
app.post('/forgot_password', async (req, res) => {
    let { email } = req.body;

    // Check if the email exists in the database
    const checkQuery = "SELECT * FROM student_database WHERE Email=?";

    try {
        const [result] = await pool.query(checkQuery, [email]);

        if (result.length === 1) {
            // If the email exists, send an OTP
            const otp = randomstring.generate({
                length: 6,
                charset: 'numeric',
            });

            // Store OTP in temporary storage
            otpStorage[email] = otp;

            // Send OTP via email
            const mailOptions = {
                from: 'stg.violin@gmail.com',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is: ${otp}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email sending error:', error);
                    return res.sendStatus(500);
                }

                console.log('Email sent:', info.response);

                // Redirect to OTP verification page
                res.redirect(`/verify_otp/${encodeURIComponent(email)}`);
            });
        } else {
            // Email not found
            res.status(404).json({ error: "Email not found" });
        }
    } catch (err) {
        console.error('MySQL Error:', err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route for rendering reset password form
app.get('/reset_password/:email', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    res.render("reset_password.ejs", { email });
});

// Route for handling reset password form submission
app.post('/reset_password/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const newPassword = req.body.newPassword;

    try {
        // Update the user's password in the database
        await pool.query('UPDATE student_database SET password = ? WHERE email = ?', [newPassword, email]);

        // Clean up: Remove used OTP from storage
        delete otpStorage[email];

        // Redirect to the login page
        res.redirect("/login");
    } catch (err) {
        console.error('MySQL error:', err);
        res.sendStatus(500); // Internal Server Error
    }
});
