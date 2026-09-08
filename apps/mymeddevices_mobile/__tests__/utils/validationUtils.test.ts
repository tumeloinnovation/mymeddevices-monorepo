import {
  checkEmail,
  checkPhone,
  validatePassword,
  checkRegistrationForm,
} from "@/utils/validationUtils";

describe("Validation Utilities", () => {
  describe("checkPhone", () => {
    it("fails when phone is empty", () => {
      const result = checkPhone("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Please enter your phone number");
    });

    it("fails on invalid phone format", () => {
      const result = checkPhone("12345");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Please enter a valid phone number");
    });

    it("accepts valid Kenyan phone formats (07..., 01..., 254..., +254...)", () => {
      expect(checkPhone("0712345678").isValid).toBe(true);
      expect(checkPhone("0112345678").isValid).toBe(true);
      expect(checkPhone("254712345678").isValid).toBe(true);
      expect(checkPhone("+254712345678").isValid).toBe(true);
      expect(checkPhone("0712 345 678").isValid).toBe(true);
    });
  });

  describe("checkRegistrationForm", () => {
    it("fails when phone number is missing", () => {
      const result = checkRegistrationForm({
        firstName: "Jane",
        lastName: "Doe",
        phone: "",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Please fill in all required fields");
    });

    it("fails when phone number is invalid format", () => {
      const result = checkRegistrationForm({
        firstName: "Jane",
        lastName: "Doe",
        phone: "12345",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Please enter a valid phone number");
    });

    it("passes when all required fields and phone are valid", () => {
      const result = checkRegistrationForm({
        firstName: "Jane",
        lastName: "Doe",
        phone: "0712345678",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.isValid).toBe(true);
    });
  });
});
