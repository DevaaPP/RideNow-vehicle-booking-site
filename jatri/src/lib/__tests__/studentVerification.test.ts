import { describe, it, expect } from "vitest";
import { validateStudentEmail } from "@/lib/studentVerification";

describe("Student Verification Domain Validation Invariants", () => {
  describe("Valid Accredited Institutional Domains", () => {
    it("accepts valid Indian university .ac.in emails", () => {
      expect(validateStudentEmail("student@gauhati.ac.in").isValid).toBe(true);
      expect(validateStudentEmail("roll123@tezu.ernet.in").isValid).toBe(true);
      expect(validateStudentEmail("scholar@aus.ac.in").isValid).toBe(true);
      expect(validateStudentEmail("test@du.ac.in").isValid).toBe(true);
    });

    it("accepts IIT, NIT, and national institute emails", () => {
      expect(validateStudentEmail("john.doe@iitg.ac.in").isValid).toBe(true);
      expect(validateStudentEmail("user@nits.ac.in").isValid).toBe(true);
      expect(validateStudentEmail("student@aiims.edu").isValid).toBe(true);
    });

    it("accepts global .edu and accredited international student emails", () => {
      expect(validateStudentEmail("student@harvard.edu").isValid).toBe(true);
      expect(validateStudentEmail("researcher@oxford.ac.uk").isValid).toBe(true);
      expect(validateStudentEmail("scholar@nus.edu.sg").isValid).toBe(true);
    });
  });

  describe("Ineligible Commercial & Personal Domains", () => {
    it("rejects generic consumer email providers", () => {
      expect(validateStudentEmail("student@gmail.com").isValid).toBe(false);
      expect(validateStudentEmail("student@yahoo.com").isValid).toBe(false);
      expect(validateStudentEmail("student@outlook.com").isValid).toBe(false);
      expect(validateStudentEmail("student@hotmail.com").isValid).toBe(false);
      expect(validateStudentEmail("student@icloud.com").isValid).toBe(false);
    });

    it("rejects generic corporate or commercial .com / .in domains", () => {
      expect(validateStudentEmail("student@company.com").isValid).toBe(false);
      expect(validateStudentEmail("student@business.in").isValid).toBe(false);
      expect(validateStudentEmail("student@co.in").isValid).toBe(false);
    });
  });

  describe("Malformed and Edge-Case Email Inputs", () => {
    it("rejects empty or whitespace-only inputs", () => {
      expect(validateStudentEmail("").isValid).toBe(false);
      expect(validateStudentEmail("   ").isValid).toBe(false);
    });

    it("rejects emails missing the @ symbol or domain", () => {
      expect(validateStudentEmail("studentgauhati.ac.in").isValid).toBe(false);
      expect(validateStudentEmail("student@").isValid).toBe(false);
      expect(validateStudentEmail("@gauhati.ac.in").isValid).toBe(false);
    });

    it("normalizes mixed-case emails before validation", () => {
      const res = validateStudentEmail("STUDENT@Gauhati.AC.IN");
      expect(res.isValid).toBe(true);
      expect(res.domain).toBe("gauhati.ac.in");
    });
  });
});
