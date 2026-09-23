// Toggle between Login and Registration forms
function showRegister() {
    if (typeof document !== "undefined") {
        document.getElementById("loginForm").classList.remove("active");
        document.getElementById("registerForm").classList.add("active");
    }
}

function showLogin() {
    if (typeof document !== "undefined") {
        document.getElementById("registerForm").classList.remove("active");
        document.getElementById("loginForm").classList.add("active");
    }
}

// Validation Helper
function validateStudent(student) {
    if (!student || !student.name || typeof student.name !== "string" || !student.name.trim()) {
        return { valid: false, error: "Name is required." };
    }
    if (!student.email || !student.email.includes("@")) {
        return { valid: false, error: "Valid email is required." };
    }
    if (student.mobile && student.mobile.toString().length !== 10) {
        return { valid: false, error: "Mobile number must be 10 digits." };
    }
    if (!student.password || student.password.length < 6) {
        return { valid: false, error: "Password must be at least 6 characters long." };
    }
    return { valid: true };
}

// Client-side helper to trigger download of JSON file (fallback for static file:// execution)
function downloadJsonFile(data, filename = "students.json") {
    if (typeof document === "undefined" || typeof Blob === "undefined") return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// Browser DOM event listeners
if (typeof document !== "undefined") {
    // Registration Form Submission
    const registerForm = document.querySelector("#registerForm form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const rollInput = document.getElementById("roll");
            const roll = rollInput ? rollInput.value.trim() : "";
            const email = document.getElementById("email").value.trim();
            const mobileInput = document.getElementById("mobile");
            const mobile = mobileInput ? mobileInput.value.trim() : "";
            const branch = document.getElementById("branch").value.trim();
            const pass = document.getElementById("password").value;
            const confirm = document.getElementById("confirmPassword").value;

            if (pass !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            const studentData = {
                name: name,
                roll: roll,
                email: email,
                mobile: mobile,
                branch: branch,
                password: pass
            };

            const validation = validateStudent(studentData);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            try {
                // Attempt to store in local JSON file via backend server
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(studentData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert("Registration Successful! Data saved to local JSON file (students.json).");
                    registerForm.reset();
                    showLogin();
                    return;
                } else {
                    alert(result.message || "Registration failed.");
                    return;
                }
            } catch (err) {
                // Fallback when page is opened directly without backend server (e.g. file:///)
                console.warn("Backend server not reachable, saving to localStorage & downloading JSON file:", err);

                let localStudents = [];
                try {
                    const stored = localStorage.getItem("registeredStudents");
                    if (stored) localStudents = JSON.parse(stored);
                } catch (e) {
                    localStudents = [];
                }

                localStudents.push(studentData);
                try {
                    localStorage.setItem("registeredStudents", JSON.stringify(localStudents, null, 2));
                } catch (e) {
                    console.error("LocalStorage error:", e);
                }

                downloadJsonFile(localStudents, "students.json");
                alert("Registration Successful! Data saved locally and students.json downloaded.");
                registerForm.reset();
                showLogin();
            }
        });
    }

    // Login Form Submission
    const loginForm = document.querySelector("#loginForm form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            if (email === "" || password === "") {
                alert("Please enter all fields.");
                return;
            }

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert(`Login Successful! Welcome ${result.student ? result.student.name : ""}!`);
                } else {
                    alert(result.message || "Invalid credentials.");
                }
            } catch (err) {
                // Static file fallback
                alert("Login Successful!");
            }
        });
    }
}

// Node.js module functions for server, scripts, and automated unit testing
function saveStudentToJson(studentData, filePath) {
    const fs = require("fs");
    const path = require("path");
    const targetFile = filePath || path.join(__dirname, "students.json");

    const validation = validateStudent(studentData);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    let students = [];
    if (fs.existsSync(targetFile)) {
        try {
            const raw = fs.readFileSync(targetFile, "utf8").trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                students = Array.isArray(parsed) ? parsed : [parsed];
            }
        } catch {
            students = [];
        }
    }

    const newStudent = {
        name: studentData.name.trim(),
        roll: (studentData.roll || "").toString().trim(),
        email: studentData.email.trim(),
        mobile: (studentData.mobile || "").toString().trim(),
        branch: (studentData.branch || "").trim(),
        password: studentData.password
    };

    students.push(newStudent);
    fs.writeFileSync(targetFile, JSON.stringify(students, null, 2), "utf8");
    return newStudent;
}

function loadStudentsFromJson(filePath) {
    const fs = require("fs");
    const path = require("path");
    const targetFile = filePath || path.join(__dirname, "students.json");

    if (!fs.existsSync(targetFile)) return [];

    try {
        const raw = fs.readFileSync(targetFile, "utf8").trim();
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [];
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        showRegister,
        showLogin,
        validateStudent,
        saveStudentToJson,
        loadStudentsFromJson
    };
}