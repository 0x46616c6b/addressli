import { describe, expect, it } from "vitest";
import type { CSVRow } from "../../types";
import { autoDetectColumns, getCSVPreview, isValidCSVFile, validateColumnSelection, downloadFailedAddressesCSV } from "../csvParser";

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

  describe("autoDetectColumns", () => {
    it("should detect German column names", () => {
      const germanHeaders = ["Name", "PLZ", "Straße", "Ort", "Email"];
      const result = autoDetectColumns(germanHeaders);
      expect(result.zipCode).toBe("PLZ");
      expect(result.street).toBe("Straße");
      expect(result.city).toBe("Ort");
    });

    it("should detect English column names", () => {
      const englishHeaders = ["Name", "ZIP", "Street", "City", "Email"];
      const result = autoDetectColumns(englishHeaders);
      expect(result.zipCode).toBe("ZIP");
      expect(result.street).toBe("Street");
      expect(result.city).toBe("City");
    });

    it("should detect mixed case column names", () => {
      const mixedHeaders = ["name", "POSTLEITZAHL", "straße", "STADT", "email"];
      const result = autoDetectColumns(mixedHeaders);
      expect(result.zipCode).toBe("POSTLEITZAHL");
      expect(result.street).toBe("straße");
      expect(result.city).toBe("STADT");
    });

    it("should handle columns with extra whitespace", () => {
      const spacedHeaders = [" PLZ ", " Straße ", " Ort ", "Name"];
      const result = autoDetectColumns(spacedHeaders);
      expect(result.zipCode).toBe(" PLZ ");
      expect(result.street).toBe(" Straße ");
      expect(result.city).toBe(" Ort ");
    });

    it("should detect alternative German terms", () => {
      const alternativeHeaders = ["Name", "Postleitzahl", "Anschrift", "Stadt", "Email"];
      const result = autoDetectColumns(alternativeHeaders);
      expect(result.zipCode).toBe("Postleitzahl");
      expect(result.street).toBe("Anschrift");
      expect(result.city).toBe("Stadt");
    });

    it("should detect alternative English terms", () => {
      const alternativeHeaders = ["Name", "Postal Code", "Address", "Town", "Email"];
      const result = autoDetectColumns(alternativeHeaders);
      expect(result.zipCode).toBe("Postal Code");
      expect(result.street).toBe("Address");
      expect(result.city).toBe("Town");
    });

    it("should prioritize exact matches over partial matches", () => {
      const headers = ["Name", "PLZ Code", "PLZ", "Street Name", "Street", "City Area", "City"];
      const result = autoDetectColumns(headers);
      expect(result.zipCode).toBe("PLZ"); // Should prefer exact match
      expect(result.street).toBe("Street"); // Should prefer exact match
      expect(result.city).toBe("City"); // Should prefer exact match
    });

    it("should return undefined for missing columns", () => {
      const limitedHeaders = ["Name", "Email", "Phone"];
      const result = autoDetectColumns(limitedHeaders);
      expect(result.zipCode).toBeUndefined();
      expect(result.street).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it("should handle empty headers array", () => {
      const result = autoDetectColumns([]);
      expect(result.zipCode).toBeUndefined();
      expect(result.street).toBeUndefined();
      expect(result.city).toBeUndefined();
    });

    it("should detect partial matches in column names", () => {
      const partialHeaders = ["Customer Name", "ZIP Code Area", "Street Address", "City Name", "Email"];
      const result = autoDetectColumns(partialHeaders);
      expect(result.zipCode).toBe("ZIP Code Area");
      expect(result.street).toBe("Street Address");
      expect(result.city).toBe("City Name");
    });

    it("should handle complex real-world headers", () => {
      const realWorldHeaders = ["Kundennummer", "Firma", "Ansprechpartner", "Straße und Hausnummer", "PLZ", "Ort", "Telefon", "E-Mail", "Bemerkungen"];
      const result = autoDetectColumns(realWorldHeaders);
      expect(result.zipCode).toBe("PLZ");
      expect(result.street).toBe("Straße und Hausnummer");
      expect(result.city).toBe("Ort");
    });

    it("should detect English business headers", () => {
      const businessHeaders = ["Company ID", "Company Name", "Contact Person", "Business Address", "Postal Code", "Municipality", "Phone", "Email", "Notes"];
      const result = autoDetectColumns(businessHeaders);
      expect(result.zipCode).toBe("Postal Code");
      expect(result.street).toBe("Business Address");
      expect(result.city).toBe("Municipality");
    });

    it("should detect variations with underscores and hyphens", () => {
      const variationHeaders = ["Name", "zip-code", "street_address", "city", "email"];
      const result = autoDetectColumns(variationHeaders);
      expect(result.zipCode).toBe("zip-code");
      expect(result.street).toBe("street_address");
      expect(result.city).toBe("city");
    });

    it("should detect additional German address terms", () => {
      const additionalGermanHeaders = ["Firma", "Straße_Hausnummer", "PLZ", "Ortschaft", "Telefon"];
      const result = autoDetectColumns(additionalGermanHeaders);
      expect(result.zipCode).toBe("PLZ");
      expect(result.street).toBe("Straße_Hausnummer");
      expect(result.city).toBe("Ortschaft");
    });

    it("should detect additional English address terms", () => {
      const additionalEnglishHeaders = ["Company", "Address Line", "Post Code", "Locality", "Contact"];
      const result = autoDetectColumns(additionalEnglishHeaders);
      expect(result.zipCode).toBe("Post Code");
      expect(result.street).toBe("Address Line");
      expect(result.city).toBe("Locality");
    });
  });

  describe("downloadFailedAddressesCSV", () => {
    // Note: This is an integration test that requires DOM APIs
    // In a real test environment, we would mock the DOM APIs properly
    it("should exist and be callable", () => {
      expect(typeof downloadFailedAddressesCSV).toBe("function");
    });

    it("should handle empty failed addresses array", () => {
      // This should not throw an error
      expect(() => downloadFailedAddressesCSV([], "test.csv")).not.toThrow();
    });
  });
});
