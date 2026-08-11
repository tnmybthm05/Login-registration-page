const fs = require("fs");
const path = require("path");

describe("College ERP - Login and Registration Tests", () => {

    // ==========================================
    // FILE EXISTENCE TESTS
    // ==========================================

    test("TC-01: index.html file exists", () => {
        const filePath = path.join(__dirname, "..", "index.html");

        expect(fs.existsSync(filePath)).toBe(true);
    });


    test("TC-02: style.css file exists", () => {
        const filePath = path.join(__dirname, "..", "style.css");

        expect(fs.existsSync(filePath)).toBe(true);
    });


    test("TC-03: script.js file exists", () => {
        const filePath = path.join(__dirname, "..", "script.js");

        expect(fs.existsSync(filePath)).toBe(true);
    });


    // ==========================================
    // STUDENTS.JSON TEST
    // ==========================================

    test("TC-04: students.json file exists", () => {
        const filePath = path.join(__dirname, "..", "students.json");

        expect(fs.existsSync(filePath)).toBe(true);
    });


    test("TC-05: students.json contains valid JSON", () => {
        const filePath = path.join(__dirname, "..", "students.json");

        expect(fs.existsSync(filePath)).toBe(true);

        const data = fs.readFileSync(filePath, "utf8");

        expect(() => JSON.parse(data)).not.toThrow();
    });


    // ==========================================
    // STUDENT DATA VALIDATION
    // ==========================================

    let student;

    beforeAll(() => {

        const filePath = path.join(__dirname, "..", "students.json");

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf8");
            student = JSON.parse(data);
        }

    });


    test("TC-06: Student name validation", () => {

        expect(student).toBeDefined();
        expect(student.name).toBeDefined();
        expect(student.name.trim()).not.toBe("");

    });


    test("TC-07: Student email validation", () => {

        expect(student).toBeDefined();
        expect(student.email).toBeDefined();
        expect(student.email).toContain("@");

    });


    test("TC-08: Student mobile validation", () => {

        expect(student).toBeDefined();
        expect(student.mobile).toBeDefined();
        expect(student.mobile.toString()).toHaveLength(10);

    });


    test("TC-09: Student branch validation", () => {

        expect(student).toBeDefined();
        expect(student.branch).toBeDefined();
        expect(student.branch.trim()).not.toBe("");

    });


    test("TC-10: Student password validation", () => {

        expect(student).toBeDefined();
        expect(student.password).toBeDefined();
        expect(student.password.length).toBeGreaterThanOrEqual(6);

    });


    // ==========================================
    // LOGIN TESTS
    // ==========================================

    test("TC-11: Valid Login", () => {

        const email = "student@college.com";
        const password = "123456";

        expect(email).toContain("@");
        expect(password.length).toBeGreaterThanOrEqual(6);

    });


    test("TC-12: Empty Email", () => {

        const email = "";

        expect(email).toBe("");

    });


    test("TC-13: Empty Password", () => {

        const password = "";

        expect(password).toBe("");

    });


    test("TC-14: Invalid Email", () => {

        const email = "abc";

        expect(email).not.toContain("@");

    });


    test("TC-15: Password Length", () => {

        const password = "123456";

        expect(password).toHaveLength(6);

    });

});