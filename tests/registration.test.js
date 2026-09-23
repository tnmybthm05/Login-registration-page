const fs = require("fs");
const path = require("path");
const {
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
    // VALIDATION TESTS
    // ==========================================

    test("TC-REG-01: Valid student passes validation", () => {
        const student = {
            name: "John Doe",
            roll: "CS101",
            email: "john@college.com",
            mobile: "9876543210",
            branch: "CSE",
            password: "secretpassword"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(true);
    });

    test("TC-REG-02: Missing or empty name fails validation", () => {
        const student = {
            name: "",
            email: "john@college.com",
            password: "secretpassword"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/name/i);
    });

    test("TC-REG-03: Invalid email fails validation", () => {
        const student = {
            name: "John Doe",
            email: "notanemail",
            password: "secretpassword"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/email/i);
    });

    test("TC-REG-04: Password shorter than 6 characters fails validation", () => {
        const student = {
            name: "John Doe",
            email: "john@college.com",
            password: "123"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/password/i);
    });

    test("TC-REG-05: Mobile number not equal to 10 digits fails validation", () => {
        const student = {
            name: "John Doe",
            email: "john@college.com",
            mobile: "12345",
            password: "secretpassword"
        };
        const res = validateStudent(student);
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/mobile/i);
    });

    // ==========================================
    // FILE STORAGE TESTS
    // ==========================================

    test("TC-REG-06: Saves first registration into a new JSON file", () => {
        const student1 = {
            name: "Alice Smith",
            roll: "CS201",
            email: "alice@college.com",
            mobile: "9123456780",
            branch: "IT",
            password: "password123"
        };

        const saved = saveStudentToJson(student1, testJsonFile);
        expect(saved.name).toBe("Alice Smith");

        expect(fs.existsSync(testJsonFile)).toBe(true);

        const loaded = loadStudentsFromJson(testJsonFile);
        expect(loaded).toHaveLength(1);
        expect(loaded[0].email).toBe("alice@college.com");
        expect(loaded[0].roll).toBe("CS201");
        expect(loaded[0].mobile).toBe("9123456780");
        expect(loaded[0].branch).toBe("IT");
    });

    test("TC-REG-07: Appends subsequent registrations to the same JSON file without data loss", () => {
        const student1 = {
            name: "Alice Smith",
            roll: "CS201",
            email: "alice@college.com",
            mobile: "9123456780",
            branch: "IT",
            password: "password123"
        };

        const student2 = {
            name: "Bob Jones",
            roll: "CS202",
            email: "bob@college.com",
            mobile: "9988776655",
            branch: "ECE",
            password: "password456"
        };

        saveStudentToJson(student1, testJsonFile);
        saveStudentToJson(student2, testJsonFile);

        const loaded = loadStudentsFromJson(testJsonFile);
        expect(loaded).toHaveLength(2);
        expect(loaded[0].name).toBe("Alice Smith");
        expect(loaded[1].name).toBe("Bob Jones");
        expect(loaded[1].email).toBe("bob@college.com");
        expect(loaded[1].mobile).toBe("9988776655");
    });

    test("TC-REG-08: Stored JSON file contains valid formatted JSON", () => {
        const student = {
            name: "Charlie Brown",
            roll: "CS203",
            email: "charlie@college.com",
            mobile: "9812345678",
            branch: "Mechanical",
            password: "charliepass"
        };

        saveStudentToJson(student, testJsonFile);

        const raw = fs.readFileSync(testJsonFile, "utf8");
        expect(() => JSON.parse(raw)).not.toThrow();

        const parsed = JSON.parse(raw);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].name).toBe("Charlie Brown");
    });
});
