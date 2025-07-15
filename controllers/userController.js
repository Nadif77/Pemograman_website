// controllers/userController.js
const db = require("../config/database");
const bcrypt = require("bcryptjs");

// Helper to promisify db.get for async/await use
const dbGetAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to promisify db.run for async/await use
const dbRunAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    // Use 'function' keyword to retain 'this' context for lastID/changes
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID, changes
    });
  });
};

// Get students list (teachers/admin only)
const getStudents = (req, res) => {
  // Also include created_at for dashboard display if needed for sorting or full view
  db.all(
    'SELECT id, username, name, class, created_at FROM users WHERE role = "student" ORDER BY class, name',
    [],
    (err, students) => {
      if (err) {
        console.error("Database error fetching students:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(students);
    }
  );
};

// --- New Student Management Functions (Admin Only) ---

// Add a new student
const addStudent = async (req, res) => {
  const { username, password, name, s_class } = req.body; // s_class is for student's class

  if (!username || !password || !name || !s_class) {
    return res
      .status(400)
      .json({
        error:
          "Username, password, name, and class are required for a new student.",
      });
  }

  try {
    // Check if username already exists
    const existingUser = await dbGetAsync(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new student into the database
    const result = await dbRunAsync(
      'INSERT INTO users (username, password, name, role, class) VALUES (?, ?, ?, "student", ?)',
      [username, hashedPassword, name, s_class]
    );
    res
      .status(201)
      .json({ id: result.lastID, message: "Student added successfully." });
  } catch (err) {
    console.error("Error adding new student:", err.message);
    if (
      err.message &&
      err.message.includes("UNIQUE constraint failed: users.username")
    ) {
      return res.status(409).json({ error: "Username already exists." });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

// Update an existing student
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { username, name, s_class, password } = req.body; // s_class for student's class

  if (!username || !name || !s_class) {
    return res
      .status(400)
      .json({
        error: "Username, name, and class are required for updating a student.",
      });
  }

  try {
    // Verify the user exists and is a student
    const user = await dbGetAsync(
      'SELECT id, password FROM users WHERE id = ? AND role = "student"',
      [id]
    );
    if (!user) {
      return res
        .status(404)
        .json({ error: "Student not found or unauthorized." });
    }

    let updateQuery = "UPDATE users SET username = ?, name = ?, class = ?";
    let queryParams = [username, name, s_class];

    // If password is provided, hash it and add to the update query
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      queryParams.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    // Execute the update query
    const result = await dbRunAsync(updateQuery, queryParams);
    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Student not found or no changes made." });
    }
    res.json({ message: "Student updated successfully." });
  } catch (err) {
    console.error("Error updating student:", err.message);
    if (
      err.message &&
      err.message.includes("UNIQUE constraint failed: users.username")
    ) {
      return res.status(409).json({ error: "Username already exists." });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

// Delete a student
const deleteStudent = (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM users WHERE id = ? AND role = "student"',
    [id],
    function (err) {
      if (err) {
        console.error("Database error deleting student:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found." });
      }
      res.json({ message: "Student deleted successfully." });
    }
  );
};

module.exports = {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
};
