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

// Email format validation: "b<digits>@skit.ac.in" ('b' constant followed by digits)
function validateEmail(email) {
    if (!email || typeof email !== "string") {
        return { valid: false, error: "Email is required." };
    }
    const cleanEmail = email.trim();
    const emailRegex = /^b\d+@skit\.ac\.in$/i;
    if (!emailRegex.test(cleanEmail)) {
        return {
            valid: false,
            error: "Email must be in the format 'b<digits>@skit.ac.in' (e.g. b240369@skit.ac.in)."
        };
    }
    return { valid: true };
}

// Google-style password validation:
// Minimum 8 characters, with uppercase, lowercase, number, and special character
function validatePassword(password) {
    if (!password || typeof password !== "string") {
        return { valid: false, error: "Password is required." };
    }
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one lowercase letter (a-z)." };
    }
    if (!/\d/.test(password)) {
        return { valid: false, error: "Password must contain at least one digit (0-9)." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
        return { valid: false, error: "Password must contain at least one special character (e.g. !@#$%^&*)." };
    }
    return { valid: true };
}

// Validation Helper
function validateStudent(student) {
    if (!student || !student.name || typeof student.name !== "string" || !student.name.trim()) {
        return { valid: false, error: "Name is required." };
    }
    const emailValidation = validateEmail(student.email);
    if (!emailValidation.valid) {
        return emailValidation;
    }
    if (student.mobile && student.mobile.toString().length !== 10) {
        return { valid: false, error: "Mobile number must be 10 digits." };
    }
    const passwordValidation = validatePassword(student.password);
    if (!passwordValidation.valid) {
        return passwordValidation;
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

            const emailCheck = validateEmail(email);
            if (!emailCheck.valid) {
                alert(emailCheck.error);
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
                    const student = result.student || {};
                    if (typeof sessionStorage !== "undefined") {
                        sessionStorage.setItem("loggedInUser", JSON.stringify(student));
                    }
                    const params = new URLSearchParams({
                        name: student.name || "",
                        email: student.email || email,
                        roll: student.roll || "",
                        branch: student.branch || "",
                        mobile: student.mobile || ""
                    });
                    window.location.href = `dashboard.html?${params.toString()}`;
                } else {
                    alert(result.message || "Invalid credentials.");
                }
            } catch (err) {
                // Static file fallback (e.g. file:/// protocol)
                let matchedStudent = null;
                try {
                    const stored = localStorage.getItem("registeredStudents");
                    if (stored) {
                        const list = JSON.parse(stored);
                        matchedStudent = list.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
                    }
                } catch (e) {}

                if (!matchedStudent) {
                    const defaultName = email.includes("@") ? email.split("@")[0] : "Student";
                    matchedStudent = { name: defaultName, email: email };
                }

                if (typeof sessionStorage !== "undefined") {
                    sessionStorage.setItem("loggedInUser", JSON.stringify(matchedStudent));
                }

                const params = new URLSearchParams({
                    name: matchedStudent.name || "",
                    email: matchedStudent.email || email,
                    roll: matchedStudent.roll || "",
                    branch: matchedStudent.branch || "",
                    mobile: matchedStudent.mobile || ""
                });
                window.location.href = `dashboard.html?${params.toString()}`;
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
        validateEmail,
        validatePassword,
        validateStudent,
        saveStudentToJson,
        loadStudentsFromJson
    };
}