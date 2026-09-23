const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const STUDENTS_FILE = path.join(__dirname, "students.json");

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

/**
 * Reads students from students.json.
 * Always returns an array of student objects.
 */
function readStudentsFile(filePath = STUDENTS_FILE) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(filePath, "utf8").trim();
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
        console.error("Error reading students file:", err);
        return [];
    }
}

/**
 * Writes students array to students.json.
 */
function writeStudentsFile(students, filePath = STUDENTS_FILE) {
    fs.writeFileSync(filePath, JSON.stringify(students, null, 2), "utf8");
}

/**
 * Parses request body (JSON or URL-encoded).
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            if (!body) {
                return resolve({});
            }
            try {
                // Try JSON first
                return resolve(JSON.parse(body));
            } catch {
                try {
                    // Fallback to URL-encoded form data
                    const params = new URLSearchParams(body);
                    const parsed = {};
                    for (const [key, value] of params.entries()) {
                        parsed[key] = value;
                    }
                    return resolve(parsed);
                } catch (err) {
                    return reject(err);
                }
            }
        });
        req.on("error", reject);
    });
}

/**
 * Sends a JSON response with status code.
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(data));
}

/**
 * Serves static files.
 */
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end(`500 Server Error: ${err.message}`);
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (req.method === "GET" && (pathname === "/api/students" || pathname === "/students")) {
        const students = readStudentsFile();
        return sendJson(res, 200, { success: true, count: students.length, students });
    }

    if (req.method === "POST" && (pathname === "/api/register" || pathname === "/register")) {
        try {
            const body = await parseRequestBody(req);
            const { name, roll, email, mobile, branch, password } = body;

            // Validations
            if (!name || !email || !password) {
                return sendJson(res, 400, {
                    success: false,
                    message: "Name, email, and password are required."
                });
            }

            const EMAIL_REGEX = /^b\d+@skit\.ac\.in$/i;
            if (!EMAIL_REGEX.test((email || "").trim())) {
                return sendJson(res, 400, {
                    success: false,
                    message: "Email must be in the format 'b<digits>@skit.ac.in' (e.g. b240369@skit.ac.in)."
                });
            }

            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasDigit = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
            if (password.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
                return sendJson(res, 400, {
                    success: false,
                    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
                });
            }

            const students = readStudentsFile();

            // Check if email already registered
            const existingIndex = students.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
            if (existingIndex !== -1) {
                return sendJson(res, 409, {
                    success: false,
                    message: "A student with this email is already registered."
                });
            }

            const newStudent = {
                name: name.trim(),
                roll: (roll || "").trim(),
                email: email.trim(),
                mobile: (mobile || "").trim(),
                branch: (branch || "").trim(),
                password: password
            };

            students.push(newStudent);
            writeStudentsFile(students);

            return sendJson(res, 201, {
                success: true,
                message: "Registration successful! Data saved to students.json.",
                student: newStudent
            });
        } catch (err) {
            console.error("Registration error:", err);
            return sendJson(res, 500, {
                success: false,
                message: "Internal server error while saving registration data."
            });
        }
    }

    if (req.method === "POST" && (pathname === "/api/login" || pathname === "/login")) {
        try {
            const body = await parseRequestBody(req);
            const { email, password } = body;

            if (!email || !password) {
                return sendJson(res, 400, {
                    success: false,
                    message: "Please enter all fields."
                });
            }

            const EMAIL_REGEX = /^b\d+@skit\.ac\.in$/i;
            if (!EMAIL_REGEX.test(email.trim())) {
                return sendJson(res, 400, {
                    success: false,
                    message: "Email must be in the format 'b<digits>@skit.ac.in' (e.g. b240369@skit.ac.in)."
                });
            }

            const students = readStudentsFile();
            const matchedStudent = students.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);

            if (!matchedStudent) {
                return sendJson(res, 401, {
                    success: false,
                    message: "Invalid email or password."
                });
            }

            return sendJson(res, 200, {
                success: true,
                message: "Login successful!",
                student: {
                    name: matchedStudent.name,
                    email: matchedStudent.email,
                    roll: matchedStudent.roll,
                    branch: matchedStudent.branch,
                    mobile: matchedStudent.mobile
                }
            });
        } catch (err) {
            console.error("Login error:", err);
            return sendJson(res, 500, {
                success: false,
                message: "Internal server error."
            });
        }
    }

    // Static File Serving
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
    if (safePath === "/" || safePath === "\\") {
        safePath = "/index.html";
    } else if (safePath === "/dashboard" || safePath === "\\dashboard") {
        safePath = "/dashboard.html";
    }

    const fullPath = path.join(__dirname, safePath);
    serveStaticFile(res, fullPath);
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = {
    server,
    readStudentsFile,
    writeStudentsFile
};
