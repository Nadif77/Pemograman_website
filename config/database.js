// config/database.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const DB_PATH = "school.db";

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Users table (students and teachers/admin)
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
            class TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      (err) => {
        if (err) console.error("Error creating users table:", err.message);
        else insertDefaultUsers();
      }
    );

    // Enrollments table for student registrations
    db.run(
      `CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            dob TEXT NOT NULL, -- Date of Birth (e.g., "Yogyakarta, 12 Januari 2017")
            address TEXT NOT NULL,
            parent_name TEXT NOT NULL,
            parent_phone TEXT NOT NULL,
            target_class TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      (err) => {
        if (err)
          console.error("Error creating enrollments table:", err.message);
      }
    );

    // Removed materials and attendance tables
  });
}

function insertDefaultUsers() {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, name, role) 
            VALUES ('admin', ?, 'Administrator', 'admin')`,
    [adminPassword],
    (err) => {
      if (err) console.error("Error inserting default admin:", err.message);
    }
  );

  const teacherPassword = bcrypt.hashSync("teacher123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, name, role) 
            VALUES ('guru1', ?, 'Bapak Andi Saputra', 'teacher')`,
    [teacherPassword],
    (err) => {
      if (err) console.error("Error inserting sample teacher:", err.message);
    }
  );

  const studentPassword = bcrypt.hashSync("student123", 10);
  const students = [
    ["siswa1", "Ahmad Rizki", "Kelas 1"],
    ["siswa2", "Siti Aminah", "Kelas 1"],
    ["siswa3", "Budi Santoso", "Kelas 2"],
    ["siswa4", "Dewi Sartika", "Kelas 2"],
    ["siswa5", "Fajar Nugraha", "Kelas 3"],
  ];

  students.forEach(([username, name, kelas]) => {
    db.run(
      `INSERT OR IGNORE INTO users (username, password, name, role, class) 
                VALUES (?, ?, ?, 'student', ?)`,
      [username, studentPassword, name, kelas],
      (err) => {
        if (err)
          console.error(`Error inserting student ${username}:`, err.message);
      }
    );
  });
}

module.exports = db;
