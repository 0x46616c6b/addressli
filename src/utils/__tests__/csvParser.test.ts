import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CSVRow, ProcessedAddress } from "../../types";
import { autoDetectColumns, downloadFailedAddressesCSV, getCSVPreview, isValidCSVFile, validateColumnSelection } from "../csvParser";

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
    // Mock DOM APIs
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let mockBlob: ReturnType<typeof vi.fn>;

    // Store original implementations
    let originalCreateElement: typeof document.createElement;
    let originalAppendChild: typeof document.body.appendChild;
    let originalRemoveChild: typeof document.body.removeChild;
    let originalURL: typeof global.URL;
    let originalBlob: typeof global.Blob;

    beforeEach(() => {
      // Save original implementations
      originalCreateElement = document.createElement;
      originalAppendChild = document.body.appendChild;
      originalRemoveChild = document.body.removeChild;
      originalURL = global.URL;
      originalBlob = global.Blob;

      // Mock document.createElement
      mockCreateElement = vi.fn();
      mockClick = vi.fn();
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      const mockAnchorElement = {
        href: "",
        download: "",
        style: { display: "" },
        click: mockClick,
      };

      mockCreateElement.mockReturnValue(mockAnchorElement);

      // Mock document methods
      Object.defineProperty(document, "createElement", {
        value: mockCreateElement,
        writable: true,
      });
      Object.defineProperty(document.body, "appendChild", {
        value: mockAppendChild,
        writable: true,
      });
      Object.defineProperty(document.body, "removeChild", {
        value: mockRemoveChild,
        writable: true,
      });

      // Mock URL APIs
      mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      mockRevokeObjectURL = vi.fn();

      Object.defineProperty(global, "URL", {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
        writable: true,
      });

      // Mock Blob constructor
      mockBlob = vi.fn().mockImplementation((content: BlobPart[], options?: BlobPropertyBag) => ({
        content,
        options,
        type: options?.type || "text/plain",
      }));

      global.Blob = mockBlob;
    });

    afterEach(() => {
      // Restore original implementations
      Object.defineProperty(document, "createElement", {
        value: originalCreateElement,
        writable: true,
      });
      Object.defineProperty(document.body, "appendChild", {
        value: originalAppendChild,
        writable: true,
      });
      Object.defineProperty(document.body, "removeChild", {
        value: originalRemoveChild,
        writable: true,
      });
      Object.defineProperty(global, "URL", {
        value: originalURL,
        writable: true,
      });
      global.Blob = originalBlob;

      // Clear all mocks
      vi.clearAllMocks();
    });

    it("should handle empty failed addresses array gracefully", () => {
      downloadFailedAddressesCSV([], "test.csv");

      // Should not create any DOM elements or blobs when array is empty
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockBlob).not.toHaveBeenCalled();
    });

    it("should create CSV with original data only (no error messages)", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { street: "Musterstraße 123", city: "Berlin", plz: "10115" },
          error: "Address not found",
        },
        {
          originalData: { street: "Invalid Street", city: "Munich", plz: "80331" },
          error: "Geocoding service unavailable",
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "addresses.csv");

      // Verify Blob was created with correct CSV content (original column order)
      expect(mockBlob).toHaveBeenCalledWith([expect.stringContaining("street,city,plz")], { type: "text/csv;charset=utf-8;" });

      const blobCall = mockBlob.mock.calls[0];
      const csvContent = blobCall[0][0] as string;

      // Verify CSV content includes original data but NOT error messages
      expect(csvContent).toContain("Musterstraße 123");
      expect(csvContent).toContain("Invalid Street");
      expect(csvContent).toContain("Berlin");
      expect(csvContent).toContain("Munich");

      // Should NOT contain error messages
      expect(csvContent).not.toContain("Address not found");
      expect(csvContent).not.toContain("Geocoding service unavailable");
      expect(csvContent).not.toContain("error_message");
    });

    it("should handle addresses with different column structures and preserve order", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { name: "Company A", address: "Street 1", zip: "12345" },
          error: "Error 1",
        },
        {
          originalData: { company: "Company B", street: "Street 2", postcode: "67890", phone: "123456789" },
          error: "Error 2",
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "test.csv");

      expect(mockBlob).toHaveBeenCalled();
      const csvContent = mockBlob.mock.calls[0][0][0] as string;

      // Should include all unique columns from both addresses in order of first appearance
      expect(csvContent).toContain("name");
      expect(csvContent).toContain("address");
      expect(csvContent).toContain("zip");
      expect(csvContent).toContain("company");
      expect(csvContent).toContain("street");
      expect(csvContent).toContain("postcode");
      expect(csvContent).toContain("phone");

      // Should NOT contain error_message
      expect(csvContent).not.toContain("error_message");

      // Verify the column order matches first appearance: name, address, zip, company, street, postcode, phone
      const lines = csvContent.split("\n");
      const headerLine = lines[0].trim(); // Trim to remove any trailing whitespace
      expect(headerLine).toBe("name,address,zip,company,street,postcode,phone");
    });

    it("should handle addresses without error messages gracefully", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { street: "Test Street", city: "Test City" },
          // No error property
        },
        {
          originalData: { street: "Another Street", city: "Another City" },
          error: undefined, // Explicitly undefined
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "test.csv");

      const csvContent = mockBlob.mock.calls[0][0][0] as string;

      // Should contain original data
      expect(csvContent).toContain("Test Street");
      expect(csvContent).toContain("Test City");
      expect(csvContent).toContain("Another Street");
      expect(csvContent).toContain("Another City");

      // Should NOT contain any error-related content
      expect(csvContent).not.toContain("Unknown error");
      expect(csvContent).not.toContain("error_message");
    });

    it("should generate correct filename with timestamp", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { street: "Test Street" },
          error: "Test error",
        },
      ];

      // Mock Date.prototype.toISOString to return predictable timestamp
      const mockDate = new Date("2023-06-15T10:30:45.123Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);
      vi.spyOn(mockDate, "toISOString").mockReturnValue("2023-06-15T10:30:45.123Z");

      downloadFailedAddressesCSV(failedAddresses, "my_addresses.csv");

      // Verify anchor element download attribute
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.download).toBe("my_addresses_failed_addresses_2023-06-15T10-30-45.csv");
    });

    it("should handle filename without extension", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { street: "Test Street" },
          error: "Test error",
        },
      ];

      const mockDate = new Date("2023-06-15T10:30:45.123Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate);
      vi.spyOn(mockDate, "toISOString").mockReturnValue("2023-06-15T10:30:45.123Z");

      downloadFailedAddressesCSV(failedAddresses, "filename_no_extension");

      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.download).toBe("filename_no_extension_failed_addresses_2023-06-15T10-30-45.csv");
    });

    it("should create and trigger download link correctly", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: { street: "Test Street" },
          error: "Test error",
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "test.csv");

      // Verify DOM operations
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockCreateObjectURL).toHaveBeenCalled();

      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.href).toBe("blob:mock-url");
      expect(anchorElement.style.display).toBe("none");

      expect(mockAppendChild).toHaveBeenCalledWith(anchorElement);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(anchorElement);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
    it("should preserve all original data fields in the CSV without error messages", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: {
            id: "123",
            company: "Test Company",
            contact: "John Doe",
            street: "Musterstraße 123",
            city: "Berlin",
            plz: "10115",
            phone: "+49 30 12345678",
            email: "test@example.com",
            notes: "Some notes with special chars: äöüß",
          },
          error: "Complex address geocoding failed",
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "complex_data.csv");

      const csvContent = mockBlob.mock.calls[0][0][0] as string;

      // Verify all original fields are preserved
      expect(csvContent).toContain("id");
      expect(csvContent).toContain("company");
      expect(csvContent).toContain("contact");
      expect(csvContent).toContain("street");
      expect(csvContent).toContain("city");
      expect(csvContent).toContain("plz");
      expect(csvContent).toContain("phone");
      expect(csvContent).toContain("email");
      expect(csvContent).toContain("notes");

      // Verify data values are included
      expect(csvContent).toContain("123");
      expect(csvContent).toContain("Test Company");
      expect(csvContent).toContain("John Doe");
      expect(csvContent).toContain("Musterstraße 123");
      expect(csvContent).toContain("äöüß");

      // Should NOT contain error information
      expect(csvContent).not.toContain("error_message");
      expect(csvContent).not.toContain("Complex address geocoding failed");
    });

    it("should function as a utility without throwing errors", () => {
      expect(typeof downloadFailedAddressesCSV).toBe("function");
      expect(downloadFailedAddressesCSV.length).toBe(2); // Should take 2 parameters
    });

    it("should preserve original column order as they appear in the data", () => {
      const failedAddresses: ProcessedAddress[] = [
        {
          originalData: {
            zuletzt: "last", // This should come first
            Adresse: "middle", // This should come second
            Ürsprung: "test", // This should come third
            ämlich: "special char", // This should come fourth
            Büro: "office", // This should come last
          },
          error: "Test error",
        },
      ];

      downloadFailedAddressesCSV(failedAddresses, "test.csv");

      const csvContent = mockBlob.mock.calls[0][0][0] as string;
      const lines = csvContent.split("\n");
      const headerLine = lines[0].trim(); // Trim to remove any trailing whitespace

      // Should preserve the original order of columns as they appear in the object
      expect(headerLine).toBe("zuletzt,Adresse,Ürsprung,ämlich,Büro");

      // Verify all columns are present
      expect(headerLine).toContain("Adresse");
      expect(headerLine).toContain("ämlich");
      expect(headerLine).toContain("Büro");
      expect(headerLine).toContain("Ürsprung");
      expect(headerLine).toContain("zuletzt");

      // Should NOT contain error_message
      expect(headerLine).not.toContain("error_message");
    });
  });
});
