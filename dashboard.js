const API_BASE = "http://localhost:3000/api";
let currentUser = null;

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = JSON.parse(user);

  // Only allow admin to access this simplified dashboard
  if (currentUser.role !== "admin") {
    showCustomAlert(
      "Akses ditolak. Dashboard ini hanya untuk administrator.",
      "danger"
    ); // Changed alert to custom modal
    setTimeout(() => {
      // Give time for modal to show before redirect
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  // Verify token is still valid
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Token invalid");
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
    return;
  }

  initializeDashboard();
});

// Custom alert/modal function (replacing default alert/confirm)
function showCustomAlert(message, type = "info", callback = null) {
  const modalId = "customAlertModal";
  let modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-${type} text-white">
                        <h5 class="modal-title" id="${modalId}Label">${
    type === "success" ? "Sukses" : type === "danger" ? "Error" : "Informasi"
  }</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add confirmation buttons if a callback is provided
  if (callback) {
    modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-${type} text-white">
                            <h5 class="modal-title" id="${modalId}Label">${
      type === "danger" ? "Konfirmasi Hapus" : "Konfirmasi"
    }</h5>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-${type}" id="confirmActionButton">Ya</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  document.getElementById("content").insertAdjacentHTML("beforeend", modalHtml); // Insert outside main content for modal
  $(`#${modalId}`).modal("show");

  if (callback) {
    document.getElementById("confirmActionButton").onclick = () => {
      $(`#${modalId}`).modal("hide");
      callback();
    };
  }

  // Remove modal from DOM after it's hidden
  $(`#${modalId}`).on("hidden.bs.modal", function () {
    $(this).remove();
  });
}

function initializeDashboard() {
  // Update user info
  document.getElementById(
    "userInfo"
  ).textContent = `${currentUser.name} (${currentUser.role})`;

  // Setup sidebar navigation
  setupNavigation();

  // Load default content
  loadDashboardHome();
}

function setupNavigation() {
  const sidebar = document.getElementById("sidebarNav");
  let navItems = [];

  // Common navigation items
  navItems.push({
    id: "dashboard",
    icon: "fas fa-tachometer-alt",
    text: "Dashboard",
    onclick: "loadDashboardHome()",
  });

  // Only admin-specific features
  if (currentUser.role === "admin") {
    navItems.push(
      {
        id: "enrollments",
        icon: "fas fa-user-plus",
        text: "Pendaftaran Siswa Baru",
        onclick: "loadEnrollmentApplications()",
      },
      {
        id: "students",
        icon: "fas fa-users",
        text: "Manajemen Siswa", // Renamed for clarity
        onclick: "loadStudents()",
      },
      {
        id: "teachers",
        icon: "fas fa-chalkboard-teacher",
        text: "Manajemen Guru", // Renamed for clarity
        onclick: "loadTeacherManagement()",
      },
      {
        id: "teacher-display",
        icon: "fas fa-id-card",
        text: "Profil Guru Website",
        onclick: "loadTeacherDisplayManagement()",
      }
    );
  }
  // Removed all student and teacher-specific direct features

  sidebar.innerHTML = navItems
    .map(
      (item) => `
        <a class="nav-link" href="#" id="nav-${item.id}" onclick="${item.onclick}">
            <i class="${item.icon}"></i>${item.text}
        </a>
    `
    )
    .join("");
}

function setActiveNav(activeId) {
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  const activeLink = document.getElementById(`nav-${activeId}`);
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

async function loadDashboardHome() {
  setActiveNav("dashboard");

  let content = `
        <h2><i class="fas fa-tachometer-alt mr-2"></i>Dashboard Administrasi</h2>
        <div class="row">
    `;

  // Load statistics for admin
  const stats = await loadStatistics();

  content += `
        <div class="col-md-4">
            <div class="stat-card">
                <h3>${stats.totalStudents}</h3>
                <p class="mb-0">Total Siswa</p>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stat-card">
                <h3>${stats.totalTeachers}</h3>
                <p class="mb-0">Total Guru</p>
            </div>
        </div>
        <div class="col-md-4">
            <div class="stat-card">
                <h3>${stats.pendingEnrollments}</h3>
                <p class="mb-0">Pendaftaran Pending</p>
            </div>
        </div>
    `;

  content += `
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-info-circle mr-2"></i>Informasi</h5>
            </div>
            <div class="card-body">
                <p>Selamat datang di Sistem Manajemen SD Muhammadiyah Denpasar.</p>
                <p>Gunakan menu di sebelah kiri untuk mengelola pendaftaran siswa baru, data siswa, dan data guru.</p>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
}

async function loadStatistics() {
  try {
    const [studentsRes, enrollmentsRes, teachersRes] = await Promise.all([
      fetch(`${API_BASE}/students`, {
        // Fetch all students
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }),
      fetch(`${API_BASE}/enrollments`, {
        // Fetch all enrollments
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }),
      fetch(`${API_BASE}/teachers`, {
        // Fetch all teachers
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }),
    ]);

    const students = await studentsRes.json();
    const enrollments = await enrollmentsRes.json();
    const teachers = await teachersRes.json();

    return {
      totalStudents: students.length,
      pendingEnrollments: enrollments.filter((e) => e.status === "pending")
        .length,
      totalTeachers: teachers.length,
    };
  } catch (error) {
    console.error("Error loading dashboard statistics:", error);
    return { totalStudents: 0, pendingEnrollments: 0, totalTeachers: 0 };
  }
}

// --- Removed loadAttendanceForm, submitAttendance, loadMaterials, uploadMaterial, deleteMaterial, setupFileUpload, loadMyAttendance, loadAttendanceReport ---

async function loadStudents() {
  setActiveNav("students");

  let content = `
        <h2><i class="fas fa-users mr-2"></i>Manajemen Siswa</h2>
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Daftar Siswa</h5>
                <button class="btn btn-primary btn-sm" onclick="showAddStudentModal()">
                    <i class="fas fa-plus mr-1"></i> Tambah Siswa Baru
                </button>
            </div>
            <div class="card-body">
                <p class="text-muted">Daftar siswa di sini mencakup siswa yang akunnya telah disetujui melalui proses pendaftaran.</p>
                <div id="studentListContainer">
                    <!-- Student list will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Modal for Add/Edit Student -->
        <div class="modal fade" id="studentModal" tabindex="-1" role="dialog" aria-labelledby="studentModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="studentModalLabel">Tambah Siswa Baru</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="studentForm">
                            <input type="hidden" id="studentId">
                            <div class="form-group">
                                <label for="studentName">Nama Lengkap</label>
                                <input type="text" class="form-control" id="studentName" required>
                            </div>
                            <div class="form-group">
                                <label for="studentUsername">Username</label>
                                <input type="text" class="form-control" id="studentUsername" required>
                            </div>
                            <div class="form-group">
                                <label for="studentClass">Kelas</label>
                                <select class="form-control" id="studentClass" required>
                                    <option value="" disabled selected>Pilih Kelas</option>
                                    <option value="Kelas 1">Kelas 1</option>
                                    <option value="Kelas 2">Kelas 2</option>
                                    <option value="Kelas 3">Kelas 3</option>
                                    <option value="Kelas 4">Kelas 4</option>
                                    <option value="Kelas 5">Kelas 5</option>
                                    <option value="Kelas 6">Kelas 6</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="studentPassword">Password ${'<small class="text-muted">(Kosongkan jika tidak ingin mengubah)</small>'}</label>
                                <input type="password" class="form-control" id="studentPassword">
                            </div>
                            <div class="form-group">
                                <label for="studentConfirmPassword">Konfirmasi Password</label>
                                <input type="password" class="form-control" id="studentConfirmPassword">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="saveStudentBtn">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
  await fetchStudentList(); // Call to fetch and render student list
}

async function fetchStudentList() {
  const studentListContainer = document.getElementById("studentListContainer");
  studentListContainer.innerHTML =
    '<p class="text-muted">Memuat data siswa...</p>';

  try {
    const response = await fetch(`${API_BASE}/students`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const students = await response.json();
    console.log("Fetched Students:", students); // DEBUG: Log the fetched student data

    if (!response.ok) {
      showCustomAlert(students.error || "Gagal memuat data siswa.", "danger");
      studentListContainer.innerHTML =
        '<div class="alert alert-danger">Gagal memuat data siswa.</div>';
      return;
    }

    if (students.length === 0) {
      studentListContainer.innerHTML =
        '<p class="text-muted">Belum ada data siswa.</p>';
    } else {
      let tableHtml = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Nama</th>
                                <th>Kelas</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      students.forEach((student) => {
        // Removed 'Waktu Dibuat' column
        tableHtml += `
                    <tr>
                        <td>${student.username}</td>
                        <td>${student.name}</td>
                        <td>${student.class || "-"}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="showEditStudentModal(${
                              student.id
                            }, '${student.name}', '${student.username}', '${
          student.class
        }')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger ml-1" onclick="deleteStudentAccount(${
                              student.id
                            }, '${student.name}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </td>
                    </tr>
                `;
      });

      tableHtml += "</tbody></table></div>";
      studentListContainer.innerHTML = tableHtml;
    }
  } catch (error) {
    console.error("Error loading students:", error);
    document.getElementById("content").innerHTML = `
            <h2><i class="fas fa-users mr-2"></i>Manajemen Siswa</h2>
            <div class="alert alert-danger">Gagal memuat data siswa.</div>
        `;
  }
}

function showAddStudentModal() {
  document.getElementById("studentModalLabel").textContent =
    "Tambah Siswa Baru";
  document.getElementById("studentId").value = ""; // Clear ID for new
  document.getElementById("studentName").value = "";
  document.getElementById("studentUsername").value = "";
  document.getElementById("studentClass").value = ""; // Clear class selection
  document.getElementById("studentPassword").value = "";
  document.getElementById("studentConfirmPassword").value = "";
  document.getElementById("studentPassword").placeholder =
    "Setel password awal";
  document
    .getElementById("studentPassword")
    .closest(".form-group")
    .querySelector("label small").textContent = "";
  document
    .getElementById("studentPassword")
    .setAttribute("required", "required");

  $("#studentForm").off("submit").on("submit", addOrUpdateStudent);
  $("#studentModal").modal("show");
}

function showEditStudentModal(id, name, username, s_class) {
  document.getElementById("studentModalLabel").textContent = "Edit Data Siswa";
  document.getElementById("studentId").value = id;
  document.getElementById("studentName").value = name;
  document.getElementById("studentUsername").value = username;
  document.getElementById("studentClass").value = s_class; // Set current class
  document.getElementById("studentPassword").value = "";
  document.getElementById("studentConfirmPassword").value = "";
  document.getElementById("studentPassword").placeholder =
    "Kosongkan jika tidak ingin mengubah password";
  document
    .getElementById("studentPassword")
    .closest(".form-group")
    .querySelector("label small").textContent =
    "(Kosongkan jika tidak ingin mengubah)";
  document.getElementById("studentPassword").removeAttribute("required");

  $("#studentForm").off("submit").on("submit", addOrUpdateStudent);
  $("#studentModal").modal("show");
}

async function addOrUpdateStudent(event) {
  event.preventDefault();

  const id = document.getElementById("studentId").value;
  const name = document.getElementById("studentName").value;
  const username = document.getElementById("studentUsername").value;
  const s_class = document.getElementById("studentClass").value; // Get class value
  const password = document.getElementById("studentPassword").value;
  const confirmPassword = document.getElementById(
    "studentConfirmPassword"
  ).value;

  if (password !== confirmPassword) {
    showCustomAlert("Password dan Konfirmasi Password tidak cocok.", "danger");
    return;
  }

  const studentData = { name, username, s_class }; // Include s_class
  if (password) {
    studentData.password = password;
  }

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/students/${id}` : `${API_BASE}/students`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(studentData),
    });

    const result = await response.json();

    if (response.ok) {
      showCustomAlert(result.message, "success");
      $("#studentModal").modal("hide");
      await fetchStudentList(); // Refresh the student list
    } else {
      showCustomAlert(
        result.error || `Gagal ${id ? "memperbarui" : "menambah"} siswa.`,
        "danger"
      );
    }
  } catch (error) {
    console.error(`Error ${id ? "updating" : "adding"} student:`, error);
    showCustomAlert(
      `Terjadi kesalahan saat ${id ? "memperbarui" : "menambah"} siswa.`,
      "danger"
    );
  }
}

async function deleteStudentAccount(id, name) {
  showCustomAlert(
    `Apakah Anda yakin ingin menghapus akun siswa "${name}"?`,
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/students/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showCustomAlert(result.message, "success");
          await fetchStudentList(); // Refresh the student list
        } else {
          showCustomAlert(
            result.error || `Gagal menghapus siswa "${name}".`,
            "danger"
          );
        }
      } catch (error) {
        console.error("Error deleting student:", error);
        showCustomAlert("Terjadi kesalahan saat menghapus siswa.", "danger");
      }
    }
  );
}

async function loadEnrollmentApplications() {
  setActiveNav("enrollments");

  let content = `
        <h2><i class="fas fa-user-plus mr-2"></i>Pendaftaran Siswa Baru</h2>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Daftar Aplikasi Pendaftaran</h5>
            </div>
            <div class="card-body" id="enrollmentListContainer">
                <!-- Enrollment list will be loaded here -->
            </div>
        </div>

        <!-- Modal for Enrollment Details / Approval -->
        <div class="modal fade" id="enrollmentDetailModal" tabindex="-1" role="dialog" aria-labelledby="enrollmentDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="enrollmentDetailModalLabel">Detail Pendaftaran</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="enrollmentDetailForm">
                            <input type="hidden" id="detailEnrollmentId">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Nama Lengkap:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailFullName" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Tempat, Tanggal Lahir:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailDob" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Alamat:</label>
                                <div class="col-sm-8"><textarea class="form-control" id="detailAddress" rows="3" readonly></textarea></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Nama Orang Tua/Wali:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailParentName" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">No. HP Orang Tua:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailParentPhone" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Kelas Tujuan:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailTargetClass" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Status:</label>
                                <div class="col-sm-8">
                                    <select class="form-control" id="detailStatus" required>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Catatan Admin (Opsional):</label>
                                <div class="col-sm-8"><textarea class="form-control" id="detailNotes" rows="3"></textarea></div>
                            </div>
                            
                            <div id="approveSection" class="mt-4 border-top pt-3">
                                <h6>Setel Akun Siswa (untuk status 'Approved')</h6>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label" for="newStudentUsername">Username Siswa:</label>
                                    <div class="col-sm-8"><input type="text" class="form-control" id="newStudentUsername" placeholder="Contoh: siswa_andi" disabled></div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label" for="newStudentPassword">Password Siswa:</label>
                                    <div class="col-sm-8"><input type="password" class="form-control" id="newStudentPassword" placeholder="Setel password awal" disabled></div>
                                </div>
                                <button type="button" class="btn btn-success" id="approveEnrollmentBtn" disabled><i class="fas fa-user-plus mr-2"></i>Approve & Buat Akun Siswa</button>
                                <small class="form-text text-muted mt-2">Pastikan status "Approved" sebelum membuat akun.</small>
                            </div>

                            <div class="mt-4 text-right">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                                <button type="submit" class="btn btn-primary" id="updateEnrollmentBtn">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
  await fetchEnrollmentList();
}

async function fetchEnrollmentList() {
  const enrollmentListContainer = document.getElementById(
    "enrollmentListContainer"
  );
  enrollmentListContainer.innerHTML =
    '<p class="text-muted">Memuat data pendaftaran...</p>';

  try {
    const response = await fetch(`${API_BASE}/enrollments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const enrollments = await response.json();
    console.log("Fetched Enrollments:", enrollments); // DEBUG: Log fetched enrollments

    if (!response.ok) {
      // Handle API errors
      showCustomAlert(
        enrollments.error || "Failed to fetch enrollment data.",
        "danger"
      );
      enrollmentListContainer.innerHTML =
        '<div class="alert alert-danger">Gagal memuat data pendaftaran.</div>';
      return;
    }

    if (enrollments.length === 0) {
      enrollmentListContainer.innerHTML =
        '<p class="text-muted">Belum ada aplikasi pendaftaran baru.</p>';
      return;
    }

    let tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nama Siswa</th>
                            <th>Kelas Tujuan</th>
                            <th>Nama Orang Tua</th>
                            <th>No. HP Orang Tua</th>
                            <th>Status</th>
                            <th>Tanggal Daftar</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    enrollments.forEach((enrollment) => {
      const date = new Date(enrollment.created_at).toLocaleDateString("id-ID");
      let statusBadge = "";
      switch (enrollment.status) {
        case "pending":
          statusBadge = '<span class="badge badge-info">Pending</span>';
          break;
        case "approved":
          statusBadge = '<span class="badge badge-success">Approved</span>';
          break;
        case "rejected":
          statusBadge = '<span class="badge badge-danger">Rejected</span>';
          break;
      }

      tableHtml += `
                <tr>
                    <td>${enrollment.full_name}</td>
                    <td>${enrollment.target_class}</td>
                    <td>${enrollment.parent_name}</td>
                    <td>${enrollment.parent_phone}</td>
                    <td>${statusBadge}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewEnrollmentDetail(${enrollment.id})">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                        <button class="btn btn-sm btn-danger ml-1" onclick="deleteEnrollmentApplication(${enrollment.id})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
    });

    tableHtml += `</tbody></table></div>`;
    enrollmentListContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error("Error fetching enrollment applications:", error);
    enrollmentListContainer.innerHTML =
      '<div class="alert alert-danger">Gagal memuat data pendaftaran.</div>';
  }
}

async function viewEnrollmentDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/enrollments/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const enrollment = await response.json();

    if (!response.ok) {
      showCustomAlert(
        enrollment.error || "Gagal memuat detail pendaftaran.",
        "danger"
      );
      return;
    }

    // Populate modal fields
    document.getElementById("detailEnrollmentId").value = enrollment.id;
    document.getElementById("detailFullName").value = enrollment.full_name;
    document.getElementById("detailDob").value = enrollment.dob;
    document.getElementById("detailAddress").value = enrollment.address;
    document.getElementById("detailParentName").value = enrollment.parent_name;
    document.getElementById("detailParentPhone").value =
      enrollment.parent_phone;
    document.getElementById("detailTargetClass").value =
      enrollment.target_class;
    document.getElementById("detailStatus").value = enrollment.status;
    document.getElementById("detailNotes").value = enrollment.notes || "";

    // Handle visibility and enabled state of approval section
    const approveSection = document.getElementById("approveSection");
    const newStudentUsername = document.getElementById("newStudentUsername");
    const newStudentPassword = document.getElementById("newStudentPassword");
    const approveEnrollmentBtn = document.getElementById(
      "approveEnrollmentBtn"
    );

    if (enrollment.status === "pending") {
      approveSection.style.display = "block";
      newStudentUsername.disabled = false;
      newStudentPassword.disabled = false;
      approveEnrollmentBtn.disabled = false;
      // Pre-fill username suggestion (e.g., lowercase first word + enrollment ID)
      const firstName = enrollment.full_name.split(" ")[0].toLowerCase();
      newStudentUsername.value = `${firstName}${enrollment.id}`;
      newStudentPassword.value = ""; // Clear previous password
    } else {
      approveSection.style.display = "none"; // Hide if not pending
      newStudentUsername.disabled = true;
      newStudentPassword.disabled = true;
      approveEnrollmentBtn.disabled = true;
    }

    $("#enrollmentDetailModal").modal("show");

    // Remove previous event listeners to prevent multiple bindings
    $("#enrollmentDetailForm")
      .off("submit")
      .on("submit", updateEnrollmentDetail);
    $("#approveEnrollmentBtn")
      .off("click")
      .on("click", () => approveAndCreateStudent(enrollment.id));
  } catch (error) {
    console.error("Error viewing enrollment detail:", error);
    showCustomAlert(
      "Terjadi kesalahan saat memuat detail pendaftaran.",
      "danger"
    );
  }
}

async function updateEnrollmentDetail(event) {
  event.preventDefault();

  const id = document.getElementById("detailEnrollmentId").value;
  const formData = {
    full_name: document.getElementById("detailFullName").value,
    dob: document.getElementById("detailDob").value,
    address: document.getElementById("detailAddress").value,
    parent_name: document.getElementById("detailParentName").value,
    parent_phone: document.getElementById("detailParentPhone").value,
    target_class: document.getElementById("detailTargetClass").value,
    status: document.getElementById("detailStatus").value,
    notes: document.getElementById("detailNotes").value,
  };

  try {
    const response = await fetch(`${API_BASE}/enrollments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      showCustomAlert("Detail pendaftaran berhasil diperbarui!", "success");
      $("#enrollmentDetailModal").modal("hide"); // Close modal
      await fetchEnrollmentList(); // Refresh list
    } else {
      showCustomAlert(
        result.error || "Gagal memperbarui detail pendaftaran.",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error updating enrollment detail:", error);
    showCustomAlert(
      "Terjadi kesalahan saat memperbarui detail pendaftaran.",
      "danger"
    );
  }
}

async function deleteEnrollmentApplication(id) {
  showCustomAlert(
    "Apakah Anda yakin ingin menghapus aplikasi pendaftaran ini? Tindakan ini tidak dapat dibatalkan.",
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/enrollments/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showCustomAlert("Aplikasi pendaftaran berhasil dihapus!", "success");
          await fetchEnrollmentList(); // Refresh list
        } else {
          showCustomAlert(
            result.error || "Gagal menghapus aplikasi pendaftaran.",
            "danger"
          );
        }
      } catch (error) {
        console.error("Error deleting enrollment application:", error);
        showCustomAlert(
          "Terjadi kesalahan saat menghapus aplikasi pendaftaran.",
          "danger"
        );
      }
    }
  );
}

async function approveAndCreateStudent(enrollmentId) {
  const newStudentUsername =
    document.getElementById("newStudentUsername").value;
  const newStudentPassword =
    document.getElementById("newStudentPassword").value;
  const detailStatus = document.getElementById("detailStatus").value;

  if (detailStatus !== "pending") {
    showCustomAlert(
      'Hanya pendaftaran dengan status "Pending" yang bisa disetujui dan dibuatkan akun.',
      "danger"
    );
    return;
  }

  if (!newStudentUsername || !newStudentPassword) {
    showCustomAlert("Mohon isi Username Siswa dan Password Siswa.", "danger");
    return;
  }

  showCustomAlert(
    "Anda yakin ingin menyetujui pendaftaran ini dan membuat akun siswa baru?",
    "info",
    async () => {
      try {
        const response = await fetch(
          `${API_BASE}/enrollments/${enrollmentId}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              username: newStudentUsername,
              password: newStudentPassword,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          showCustomAlert(result.message, "success");
          $("#enrollmentDetailModal").modal("hide"); // Close modal
          await fetchEnrollmentList(); // Refresh list
          loadStudents(); // Optionally, go to the students list to see the new user
        } else {
          showCustomAlert(
            result.error ||
              "Gagal menyetujui pendaftaran dan membuat akun siswa.",
            "danger"
          );
        }
      } catch (error) {
        console.error("Error approving enrollment:", error);
        showCustomAlert(
          "Terjadi kesalahan saat menyetujui pendaftaran.",
          "danger"
        );
      }
    }
  );
}

// --- Teacher Management Functions for Dashboard ---

async function loadTeacherManagement() {
  setActiveNav("teachers");

  let content = `
        <h2><i class="fas fa-chalkboard-teacher mr-2"></i>Manajemen Data Guru</h2>
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Daftar Guru</h5>
                <button class="btn btn-primary btn-sm" onclick="showAddTeacherModal()">
                    <i class="fas fa-plus mr-1"></i> Tambah Guru Baru
                </button>
            </div>
            <div class="card-body" id="teacherListContainer">
                <!-- Teacher list will be loaded here -->
            </div>
        </div>

        <!-- Modal for Add/Edit Teacher -->
        <div class="modal fade" id="teacherModal" tabindex="-1" role="dialog" aria-labelledby="teacherModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="teacherModalLabel">Tambah Guru Baru</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="teacherForm">
                            <input type="hidden" id="teacherId">
                            <div class="form-group">
                                <label for="teacherName">Nama Lengkap</label>
                                <input type="text" class="form-control" id="teacherName" required>
                            </div>
                            <div class="form-group">
                                <label for="teacherUsername">Username</label>
                                <input type="text" class="form-control" id="teacherUsername" required>
                            </div>
                            <div class="form-group">
                                <label for="teacherPassword">Password ${'<small class="text-muted">(Kosongkan jika tidak ingin mengubah)</small>'}</label>
                                <input type="password" class="form-control" id="teacherPassword">
                            </div>
                            <div class="form-group">
                                <label for="teacherConfirmPassword">Konfirmasi Password</label>
                                <input type="password" class="form-control" id="teacherConfirmPassword">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="saveTeacherBtn">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
  await fetchTeacherList();
}

async function fetchTeacherList() {
  const teacherListContainer = document.getElementById("teacherListContainer");
  teacherListContainer.innerHTML =
    '<p class="text-muted">Memuat data guru...</p>';

  try {
    const response = await fetch(`${API_BASE}/teachers`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const teachers = await response.json();
    console.log("Fetched Teachers:", teachers); // DEBUG: Log fetched teachers

    if (!response.ok) {
      showCustomAlert(teachers.error || "Gagal memuat data guru.", "danger");
      teacherListContainer.innerHTML =
        '<div class="alert alert-danger">Gagal memuat data guru.</div>';
      return;
    }

    if (teachers.length === 0) {
      teacherListContainer.innerHTML =
        '<p class="text-muted">Belum ada data guru.</p>';
      return;
    }

    let tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nama Lengkap</th>
                            <th>Username</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    teachers.forEach((teacher) => {
      tableHtml += `
                <tr>
                    <td>${teacher.name}</td>
                    <td>${teacher.username}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="showEditTeacherModal(${teacher.id}, '${teacher.name}', '${teacher.username}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger ml-1" onclick="deleteTeacherAccount(${teacher.id}, '${teacher.name}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
    });

    tableHtml += `</tbody></table></div>`;
    teacherListContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error("Error fetching teachers:", error);
    teacherListContainer.innerHTML =
      '<div class="alert alert-danger">Gagal memuat data guru.</div>';
  }
}

function showAddTeacherModal() {
  document.getElementById("teacherModalLabel").textContent = "Tambah Guru Baru";
  document.getElementById("teacherId").value = ""; // Clear ID for new
  document.getElementById("teacherName").value = "";
  document.getElementById("teacherUsername").value = "";
  document.getElementById("teacherPassword").value = "";
  document.getElementById("teacherConfirmPassword").value = "";
  document.getElementById("teacherPassword").placeholder =
    "Setel password awal";
  document
    .getElementById("teacherPassword")
    .closest(".form-group")
    .querySelector("label small").textContent = ""; // Remove "Kosongkan jika tidak ingin mengubah"
  document
    .getElementById("teacherPassword")
    .setAttribute("required", "required"); // Password required for add

  // Remove previous event listener and add new one for adding
  $("#teacherForm").off("submit").on("submit", addOrUpdateTeacher);

  $("#teacherModal").modal("show");
}

function showEditTeacherModal(id, name, username) {
  document.getElementById("teacherModalLabel").textContent = "Edit Data Guru";
  document.getElementById("teacherId").value = id;
  document.getElementById("teacherName").value = name;
  document.getElementById("teacherUsername").value = username;
  document.getElementById("teacherPassword").value = ""; // Clear password field for security
  document.getElementById("teacherConfirmPassword").value = "";
  document.getElementById("teacherPassword").placeholder =
    "Kosongkan jika tidak ingin mengubah password";
  document
    .getElementById("teacherPassword")
    .closest(".form-group")
    .querySelector("label small").textContent =
    "(Kosongkan jika tidak ingin mengubah)"; // Add "Kosongkan jika tidak ingin mengubah"
  document.getElementById("teacherPassword").removeAttribute("required"); // Password not required for edit

  // Remove previous event listener and add new one for updating
  $("#teacherForm").off("submit").on("submit", addOrUpdateTeacher);

  $("#teacherModal").modal("show");
}

async function addOrUpdateTeacher(event) {
  event.preventDefault();

  const id = document.getElementById("teacherId").value;
  const name = document.getElementById("teacherName").value;
  const username = document.getElementById("teacherUsername").value;
  const password = document.getElementById("teacherPassword").value;
  const confirmPassword = document.getElementById(
    "teacherConfirmPassword"
  ).value;

  if (password !== confirmPassword) {
    showCustomAlert("Password dan Konfirmasi Password tidak cocok.", "danger");
    return;
  }

  const teacherData = { name, username };
  if (password) {
    // Only include password if it's provided (for new or updated)
    teacherData.password = password;
  }

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/teachers/${id}` : `${API_BASE}/teachers`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(teacherData),
    });

    const result = await response.json();

    if (response.ok) {
      showCustomAlert(result.message, "success");
      $("#teacherModal").modal("hide"); // Close modal
      await fetchTeacherList(); // Refresh the teacher list
    } else {
      showCustomAlert(
        result.error || `Gagal ${id ? "memperbarui" : "menambah"} guru.`,
        "danger"
      );
    }
  } catch (error) {
    console.error(`Error ${id ? "updating" : "adding"} teacher:`, error);
    showCustomAlert(
      `Terjadi kesalahan saat ${id ? "memperbarui" : "menambah"} guru.`,
      "danger"
    );
  }
}

async function deleteTeacherAccount(id, name) {
  showCustomAlert(
    `Apakah Anda yakin ingin menghapus akun guru "${name}"?`,
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/teachers/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showCustomAlert(result.message, "success");
          await fetchTeacherList(); // Refresh the teacher list
        } else {
          showCustomAlert(
            result.error || `Gagal menghapus guru "${name}".`,
            "danger"
          );
        }
      } catch (error) {
        console.error("Error deleting teacher:", error);
        showCustomAlert("Terjadi kesalahan saat menghapus guru.", "danger");
      }
    }
  );
}

// --- Teacher Display Management Functions for Website ---

async function loadTeacherDisplayManagement() {
  setActiveNav("teacher-display");

  let content = `
        <h2><i class="fas fa-id-card mr-2"></i>Manajemen Profil Guru Website</h2>
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Profil Guru untuk Website</h5>
                <button class="btn btn-primary btn-sm" onclick="showAddTeacherDisplayModal()">
                    <i class="fas fa-plus mr-1"></i> Tambah Profil Guru
                </button>
            </div>
            <div class="card-body">
                <p class="text-muted">Kelola profil guru yang akan ditampilkan di halaman Tenaga Pendidik website sekolah.</p>
                <div id="teacherDisplayListContainer">
                    <!-- Teacher display list will be loaded here -->
                </div>
            </div>
        </div>

        <!-- Modal for Add/Edit Teacher Display -->
        <div class="modal fade" id="teacherDisplayModal" tabindex="-1" role="dialog" aria-labelledby="teacherDisplayModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="teacherDisplayModalLabel">Tambah Profil Guru</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="teacherDisplayForm">
                            <input type="hidden" id="teacherDisplayId">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="teacherDisplayName">Nama Lengkap</label>
                                        <input type="text" class="form-control" id="teacherDisplayName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="teacherDisplayPosition">Jabatan/Posisi</label>
                                        <input type="text" class="form-control" id="teacherDisplayPosition" placeholder="Contoh: Guru Kelas 1A" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="teacherDisplaySubject">Mata Pelajaran/Bidang</label>
                                        <input type="text" class="form-control" id="teacherDisplaySubject" placeholder="Contoh: Matematika, Kelas 1A">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="teacherDisplayCategory">Kategori</label>
                                        <select class="form-control" id="teacherDisplayCategory" required>
                                            <option value="">Pilih Kategori</option>
                                            <option value="Kepala Sekolah">Kepala Sekolah</option>
                                            <option value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</option>
                                            <option value="Guru Kelas">Guru Kelas</option>
                                            <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                                            <option value="Staff">Staff</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="teacherDisplayPhoto">URL Foto</label>
                                <input type="url" class="form-control" id="teacherDisplayPhoto" placeholder="https://example.com/photo.jpg">
                                <small class="form-text text-muted">Masukkan URL foto guru. Kosongkan untuk menggunakan foto default.</small>
                            </div>
                            <div class="form-group">
                                <label for="teacherDisplayEmail">Email (Opsional)</label>
                                <input type="email" class="form-control" id="teacherDisplayEmail" placeholder="guru@sdmuhammadiyahdenpasar.sch.id">
                            </div>
                            <div class="form-group">
                                <label for="teacherDisplayDescription">Deskripsi Singkat (Opsional)</label>
                                <textarea class="form-control" id="teacherDisplayDescription" rows="3" placeholder="Deskripsi singkat tentang guru..."></textarea>
                            </div>
                            <div class="form-group">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="teacherDisplayActive" checked>
                                    <label class="form-check-label" for="teacherDisplayActive">
                                        Tampilkan di website
                                    </label>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="saveTeacherDisplayBtn">Simpan</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
  await fetchTeacherDisplayList();
}

async function fetchTeacherDisplayList() {
  const teacherDisplayListContainer = document.getElementById("teacherDisplayListContainer");
  teacherDisplayListContainer.innerHTML = '<p class="text-muted">Memuat data profil guru...</p>';

  try {
    const response = await fetch(`${API_BASE}/teacher-displays`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const teacherDisplays = await response.json();

    if (!response.ok) {
      showCustomAlert(teacherDisplays.error || "Gagal memuat data profil guru.", "danger");
      teacherDisplayListContainer.innerHTML = '<div class="alert alert-danger">Gagal memuat data profil guru.</div>';
      return;
    }

    if (teacherDisplays.length === 0) {
      teacherDisplayListContainer.innerHTML = '<p class="text-muted">Belum ada profil guru yang ditambahkan.</p>';
      return;
    }

    let tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Nama</th>
                            <th>Jabatan</th>
                            <th>Kategori</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    teacherDisplays.forEach((teacher) => {
      const photoUrl = teacher.photo_url || 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
      const statusBadge = teacher.is_active ? 
        '<span class="badge badge-success">Aktif</span>' : 
        '<span class="badge badge-secondary">Tidak Aktif</span>';

      tableHtml += `
                <tr>
                    <td><img src="${photoUrl}" alt="${teacher.name}" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;"></td>
                    <td>${teacher.name}</td>
                    <td>${teacher.position}</td>
                    <td><span class="badge badge-info">${teacher.category}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="showEditTeacherDisplayModal(${teacher.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger ml-1" onclick="deleteTeacherDisplay(${teacher.id}, '${teacher.name}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
    });

    tableHtml += `</tbody></table></div>`;
    teacherDisplayListContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error("Error fetching teacher displays:", error);
    teacherDisplayListContainer.innerHTML = '<div class="alert alert-danger">Gagal memuat data profil guru.</div>';
  }
}

function showAddTeacherDisplayModal() {
  document.getElementById("teacherDisplayModalLabel").textContent = "Tambah Profil Guru";
  document.getElementById("teacherDisplayId").value = "";
  document.getElementById("teacherDisplayName").value = "";
  document.getElementById("teacherDisplayPosition").value = "";
  document.getElementById("teacherDisplaySubject").value = "";
  document.getElementById("teacherDisplayCategory").value = "";
  document.getElementById("teacherDisplayPhoto").value = "";
  document.getElementById("teacherDisplayEmail").value = "";
  document.getElementById("teacherDisplayDescription").value = "";
  document.getElementById("teacherDisplayActive").checked = true;

  $("#teacherDisplayForm").off("submit").on("submit", addOrUpdateTeacherDisplay);
  $("#teacherDisplayModal").modal("show");
}

async function showEditTeacherDisplayModal(id) {
  try {
    const response = await fetch(`${API_BASE}/teacher-displays/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const teacher = await response.json();

    if (!response.ok) {
      showCustomAlert(teacher.error || "Gagal memuat data guru.", "danger");
      return;
    }

    document.getElementById("teacherDisplayModalLabel").textContent = "Edit Profil Guru";
    document.getElementById("teacherDisplayId").value = teacher.id;
    document.getElementById("teacherDisplayName").value = teacher.name;
    document.getElementById("teacherDisplayPosition").value = teacher.position;
    document.getElementById("teacherDisplaySubject").value = teacher.subject || "";
    document.getElementById("teacherDisplayCategory").value = teacher.category;
    document.getElementById("teacherDisplayPhoto").value = teacher.photo_url || "";
    document.getElementById("teacherDisplayEmail").value = teacher.email || "";
    document.getElementById("teacherDisplayDescription").value = teacher.description || "";
    document.getElementById("teacherDisplayActive").checked = teacher.is_active;

    $("#teacherDisplayForm").off("submit").on("submit", addOrUpdateTeacherDisplay);
    $("#teacherDisplayModal").modal("show");
  } catch (error) {
    console.error("Error fetching teacher display:", error);
    showCustomAlert("Terjadi kesalahan saat memuat data guru.", "danger");
  }
}

async function addOrUpdateTeacherDisplay(event) {
  event.preventDefault();

  const id = document.getElementById("teacherDisplayId").value;
  const teacherData = {
    name: document.getElementById("teacherDisplayName").value,
    position: document.getElementById("teacherDisplayPosition").value,
    subject: document.getElementById("teacherDisplaySubject").value,
    category: document.getElementById("teacherDisplayCategory").value,
    photo_url: document.getElementById("teacherDisplayPhoto").value,
    email: document.getElementById("teacherDisplayEmail").value,
    description: document.getElementById("teacherDisplayDescription").value,
    is_active: document.getElementById("teacherDisplayActive").checked
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/teacher-displays/${id}` : `${API_BASE}/teacher-displays`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(teacherData),
    });

    const result = await response.json();

    if (response.ok) {
      showCustomAlert(result.message, "success");
      $("#teacherDisplayModal").modal("hide");
      await fetchTeacherDisplayList();
    } else {
      showCustomAlert(
        result.error || `Gagal ${id ? "memperbarui" : "menambah"} profil guru.`,
        "danger"
      );
    }
  } catch (error) {
    console.error(`Error ${id ? "updating" : "adding"} teacher display:`, error);
    showCustomAlert(
      `Terjadi kesalahan saat ${id ? "memperbarui" : "menambah"} profil guru.`,
      "danger"
    );
  }
}

async function deleteTeacherDisplay(id, name) {
  showCustomAlert(
    `Apakah Anda yakin ingin menghapus profil guru "${name}"?`,
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/teacher-displays/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showCustomAlert(result.message, "success");
          await fetchTeacherDisplayList();
        } else {
          showCustomAlert(
            result.error || `Gagal menghapus profil guru "${name}".`,
            "danger"
          );
        }
      } catch (error) {
        console.error("Error deleting teacher display:", error);
        showCustomAlert("Terjadi kesalahan saat menghapus profil guru.", "danger");
      }
    }
  );
}

function logout() {
  showCustomAlert("Apakah Anda yakin ingin logout?", "info", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}
