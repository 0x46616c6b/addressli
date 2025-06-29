import { describe, expect, it } from "vitest";
import type { CSVRow } from "../../types";
import { getCSVPreview, isValidCSVFile, validateColumnSelection } from "../csvParser";

describe("csvParser utilities", () => {
  describe("isValidCSVFile", () => {
    it("should accept files with csv MIME type", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it("should accept files with application/csv MIME type", () => {
      const file = new File(["test"], "test.csv", { type: "application/csv" });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it("should accept files with .csv extension", () => {
      const file = new File(["test"], "test.csv", { type: "application/octet-stream" });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it("should accept files with .txt extension", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      expect(isValidCSVFile(file)).toBe(true);
    });

    it("should reject files with invalid extension and MIME type", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      expect(isValidCSVFile(file)).toBe(false);
    });

    it("should be case insensitive for extensions", () => {
      const file = new File(["test"], "test.CSV", { type: "application/octet-stream" });
      expect(isValidCSVFile(file)).toBe(true);
    });
  });

  describe("getCSVPreview", () => {
    const testData: CSVRow[] = [
      { name: "John", age: "30", city: "Berlin" },
      { name: "Jane", age: "25", city: "Munich" },
      { name: "Bob", age: "35", city: "Hamburg" },
      { name: "Alice", age: "28", city: "Cologne" },
      { name: "Charlie", age: "32", city: "Frankfurt" },
      { name: "Eve", age: "29", city: "Stuttgart" },
    ];

    it("should return first 5 rows by default", () => {
      const result = getCSVPreview(testData);
      expect(result).toHaveLength(5);
      expect(result[0].name).toBe("John");
      expect(result[4].name).toBe("Charlie");
    });

    it("should return specified number of rows", () => {
      const result = getCSVPreview(testData, 3);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("John");
      expect(result[2].name).toBe("Bob");
    });

    it("should return all rows if data length is less than maxRows", () => {
      const smallData = testData.slice(0, 3);
      const result = getCSVPreview(smallData, 5);
      expect(result).toHaveLength(3);
    });

    it("should handle empty data", () => {
      const result = getCSVPreview([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("validateColumnSelection", () => {
    const headers = ["name", "street", "zipCode", "city", "email"];

    it("should validate when at least one address column is selected", () => {
      const result = validateColumnSelection(headers, "zipCode", undefined, "city");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate when only one address column is selected", () => {
      const result = validateColumnSelection(headers, undefined, "street", undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when no address columns are selected", () => {
      const result = validateColumnSelection(headers, undefined, undefined, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("At least one address component (ZIP, street, or city) must be selected");
    });

    it("should fail when headers are empty", () => {
      const result = validateColumnSelection([], "zipCode", "street", "city");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("No column headers found");
    });

    it("should fail when selected column does not exist in headers", () => {
      const result = validateColumnSelection(headers, "nonexistent", "street", "city");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid columns selected: nonexistent");
    });

    it("should fail when multiple selected columns do not exist", () => {
      const result = validateColumnSelection(headers, "nonexistent1", "nonexistent2", "city");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid columns selected: nonexistent1, nonexistent2");
    });

    it("should validate when empty strings are passed instead of undefined", () => {
      const result = validateColumnSelection(headers, "", "street", "");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
