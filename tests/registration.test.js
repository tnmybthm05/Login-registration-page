const fs = require("fs");
const path = require("path");
const {
    validateEmail,
    validatePassword,
    validateStudent,
    saveStudentToJson,
    loadStudentsFromJson
} = require("../script");

describe("Registration and Local JSON File Storage Tests", () => {
    const tempDir = path.join(__dirname, "temp");
    const testJsonFile = path.join(tempDir, "test_students.json");

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
    });

    afterAll(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        if (fs.existsSync(testJsonFile)) {
            fs.unlinkSync(testJsonFile);
        }
    });

    // ==========================================
    // EMAIL FORMAT TESTS (b<digits>@skit.ac.in)
    // ==========================================

    test("TC-EMAIL-01: Valid format b240369@skit.ac.in passes email validation", () => {
        const res = validateEmail("b240369@skit.ac.in");
        expect(res.valid).toBe(true);
    });

    test("TC-EMAIL-02: Email without prefix 'b' fails validation", () => {
        const res = validateEmail("240369@skit.ac.in");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/skit\.ac\.in/i);
    });

    test("TC-EMAIL-03: Email with non-digit characters after 'b' fails validation", () => {
        const res = validateEmail("bABCDE@skit.ac.in");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/skit\.ac\.in/i);
    });

    test("TC-EMAIL-04: Non-skit domain fails validation", () => {
        const res = validateEmail("b240369@gmail.com");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/skit\.ac\.in/i);
    });

    // ==========================================
    // GOOGLE-STYLE PASSWORD TESTS
    // ==========================================

    test("TC-PASS-01: Valid Google-style password passes", () => {
        const res = validatePassword("Password@123");
        expect(res.valid).toBe(true);
    });

    test("TC-PASS-02: Password less than 8 chars fails", () => {
        const res = validatePassword("Pass@1");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/8 characters/i);
    });

    test("TC-PASS-03: Password without uppercase fails", () => {
        const res = validatePassword("password@123");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/uppercase/i);
    });

    test("TC-PASS-04: Password without lowercase fails", () => {
        const res = validatePassword("PASSWORD@123");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/lowercase/i);
    });

    test("TC-PASS-05: Password without digit fails", () => {
        const res = validatePassword("Password@abc");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/digit/i);
    });

    test("TC-PASS-06: Password without special character fails", () => {
        const res = validatePassword("Password123");
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/special character/i);
    });

    // ==========================================
    // OVERALL STUDENT VALIDATION TESTS
    // ==========================================

    test("TC-REG-01: Valid student with skit email and Google-style password passes", () => {
        const student = {
            name: "John Doe",
            roll: "CS101",
            email: "b240369@skit.ac.in",
            mobile: "9876543210",
            branch: "CSE",
            password: "Secret@Password1"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(true);
    });

    test("TC-REG-02: Missing or empty name fails validation", () => {
        const student = {
            name: "",
            email: "b240369@skit.ac.in",
            password: "Secret@Password1"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/name/i);
    });

    test("TC-REG-03: Mobile number not equal to 10 digits fails validation", () => {
        const student = {
            name: "John Doe",
            email: "b240369@skit.ac.in",
            mobile: "12345",
            password: "Secret@Password1"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/mobile/i);
    });

    // ==========================================
    // FILE STORAGE TESTS
    // ==========================================

    test("TC-REG-04: Saves first registration into a new JSON file", () => {
        const student1 = {
            name: "Alice Smith",
            roll: "CS201",
            email: "b240201@skit.ac.in",
            mobile: "9123456780",
            branch: "IT",
            password: "Password@123"
        };

        const saved = saveStudentToJson(student1, testJsonFile);
        expect(saved.name).toBe("Alice Smith");

        expect(fs.existsSync(testJsonFile)).toBe(true);

        const loaded = loadStudentsFromJson(testJsonFile);
        expect(loaded).toHaveLength(1);
        expect(loaded[0].email).toBe("b240201@skit.ac.in");
        expect(loaded[0].roll).toBe("CS201");
        expect(loaded[0].mobile).toBe("9123456780");
        expect(loaded[0].branch).toBe("IT");
    });

    test("TC-REG-05: Appends subsequent registrations to the same JSON file without data loss", () => {
        const student1 = {
            name: "Alice Smith",
            roll: "CS201",
            email: "b240201@skit.ac.in",
            mobile: "9123456780",
            branch: "IT",
            password: "Password@123"
        };

        const student2 = {
            name: "Bob Jones",
            roll: "CS202",
            email: "b240202@skit.ac.in",
            mobile: "9988776655",
            branch: "ECE",
            password: "Password@456"
        };

        saveStudentToJson(student1, testJsonFile);
        saveStudentToJson(student2, testJsonFile);

        const loaded = loadStudentsFromJson(testJsonFile);
        expect(loaded).toHaveLength(2);
        expect(loaded[0].name).toBe("Alice Smith");
        expect(loaded[1].name).toBe("Bob Jones");
        expect(loaded[1].email).toBe("b240202@skit.ac.in");
        expect(loaded[1].mobile).toBe("9988776655");
    });

    test("TC-REG-06: Stored JSON file contains valid formatted JSON", () => {
        const student = {
            name: "Charlie Brown",
            roll: "CS203",
            email: "b240203@skit.ac.in",
            mobile: "9812345678",
            branch: "Mechanical",
            password: "Password@789"
        };

        saveStudentToJson(student, testJsonFile);

        const raw = fs.readFileSync(testJsonFile, "utf8");
        expect(() => JSON.parse(raw)).not.toThrow();

        const parsed = JSON.parse(raw);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].name).toBe("Charlie Brown");
    });
});
