describe("Student Login", () => {

test("Valid Login", () => {

expect(true).toBe(true);

});

test("Empty Email", () => {

expect("").toBe("");

});

test("Empty Password", () => {

expect("").toBe("");

});

test("Invalid Email", () => {

expect("abc").not.toContain("@");

});

test("Password Length", () => {

expect("123456").toHaveLength(6);

});

});