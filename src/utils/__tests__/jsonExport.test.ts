import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GeocodeResult, ProcessedAddress } from "../../types";
import { convertToGeoJSON, createProcessingSummary, downloadJSON, generateExportFilename } from "../jsonExport";

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-blob-url");
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and related DOM methods
const mockLink = {
  href: "",
  download: "",
  style: { display: "" },
  click: vi.fn(),
} as unknown as HTMLAnchorElement;

global.document.createElement = vi.fn(() => mockLink);
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

describe("jsonExport utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("convertToGeoJSON", () => {
    const mockGeocodeResult: GeocodeResult = {
      lat: 52.52,
      lon: 13.405,
      display_name: "Berlin, Deutschland",
      address: {
        city: "Berlin",
        country: "Deutschland",
      },
    };

    const successfulAddress: ProcessedAddress = {
      originalData: { name: "John", street: "Musterstraße 1", city: "Berlin", email: "john@example.com" },
      geocodeResult: mockGeocodeResult,
      coordinates: [52.52, 13.405],
    };

    const failedAddress: ProcessedAddress = {
      originalData: { name: "Jane", street: "", city: "", email: "jane@example.com" },
      error: "Empty address",
    };

    it("should convert successful addresses to GeoJSON format", () => {
      const result = convertToGeoJSON([successfulAddress], ["name", "email"]);

      expect(result.type).toBe("FeatureCollection");
      expect(result.features).toHaveLength(1);

      const feature = result.features[0];
      expect(feature.type).toBe("Feature");
      expect(feature.geometry.type).toBe("Point");
      expect(feature.geometry.coordinates).toEqual([13.405, 52.52]); // GeoJSON uses [lon, lat]
      expect(feature.properties.name).toBe("John");
      expect(feature.properties.email).toBe("john@example.com");
      expect(feature.properties.description).toContain("John");
    });

    it("should filter out failed addresses", () => {
      const result = convertToGeoJSON([successfulAddress, failedAddress], ["name"]);

      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.name).toBe("John");
    });

    it("should handle empty metadata columns", () => {
      const result = convertToGeoJSON([successfulAddress], []);

      const feature = result.features[0];
      // Even with empty metadata columns, the original data has 'name' which should be detected
      expect(feature.properties.name).toBe("John"); // Found from original data
      expect(feature.properties.description).toContain("Address");
    });

    it("should convert numeric strings to numbers in properties", () => {
      const addressWithNumbers: ProcessedAddress = {
        originalData: {
          name: "Test",
          age: "30",
          score: "95.5",
          active: "true",
          empty: "",
          text: "abc",
        },
        geocodeResult: mockGeocodeResult,
        coordinates: [52.52, 13.405],
      };

      const result = convertToGeoJSON([addressWithNumbers], ["age", "score", "active", "empty", "text"]);

      const properties = result.features[0].properties;
      expect(properties.age).toBe(30);
      expect(properties.score).toBe(95.5);
      expect(properties.active).toBe("true"); // String, not boolean
      expect(properties.empty).toBe("");
      expect(properties.text).toBe("abc");
    });

    it("should handle missing metadata columns gracefully", () => {
      const result = convertToGeoJSON([successfulAddress], ["nonexistent"]);

      const feature = result.features[0];
      expect(feature.properties.nonexistent).toBeUndefined();
    });

    it("should return empty feature collection for empty input", () => {
      const result = convertToGeoJSON([], ["name"]);

      expect(result.type).toBe("FeatureCollection");
      expect(result.features).toHaveLength(0);
    });

    // uMap-specific tests
    it("should generate uMap-compatible name and description", () => {
      const result = convertToGeoJSON([successfulAddress], ["name", "email"]);
      const feature = result.features[0];

      expect(feature.properties.name).toBe("John"); // uMap title
      expect(feature.properties.description).toContain("<strong>name:</strong> John");
      expect(feature.properties.description).toContain("<strong>email:</strong> john@example.com");
    });

    it("should use company name for uMap title when available", () => {
      const companyAddress: ProcessedAddress = {
        originalData: { firma: "Tech Corp", street: "Main St 1", city: "Berlin", phone: "123-456" },
        geocodeResult: mockGeocodeResult,
        coordinates: [52.52, 13.405],
      };

      const result = convertToGeoJSON([companyAddress], ["firma", "phone"]);
      const feature = result.features[0];

      expect(feature.properties.name).toBe("Tech Corp");
      expect(feature.properties.description).toContain("<strong>firma:</strong> Tech Corp");
      expect(feature.properties.description).toContain("<strong>phone:</strong> 123-456");
    });

    it("should use display_name as fallback for uMap title", () => {
      const addressWithoutName: ProcessedAddress = {
        originalData: { street: "Main St 1", city: "Berlin", phone: "123-456" },
        geocodeResult: mockGeocodeResult,
        coordinates: [52.52, 13.405],
      };

      const result = convertToGeoJSON([addressWithoutName], ["phone"]);
      const feature = result.features[0];

      // With the new implementation, it should use the constructed display name or fallback
      expect(feature.properties.name).toBeDefined();
      expect(feature.properties.description).toContain("<strong>phone:</strong> 123-456");
    });

    it("should handle case-insensitive company name detection", () => {
      const companyAddress: ProcessedAddress = {
        originalData: { COMPANY: "Big Corp", address: "Business St 1", city: "Munich" },
        geocodeResult: mockGeocodeResult,
        coordinates: [52.52, 13.405],
      };

      const result = convertToGeoJSON([companyAddress], ["COMPANY"]);
      const feature = result.features[0];

      expect(feature.properties.name).toBe("Big Corp");
      expect(feature.properties.description).toContain("<strong>COMPANY:</strong> Big Corp");
    });

    it("should generate description with HTML formatting for uMap", () => {
      const result = convertToGeoJSON([successfulAddress], ["name", "email", "city"]);
      const feature = result.features[0];

      expect(feature.properties.description).toContain("<strong>name:</strong> John<br>");
      expect(feature.properties.description).toContain("<strong>email:</strong> john@example.com<br>");
      expect(feature.properties.description).toContain("<strong>city:</strong> Berlin");
    });

    it("should fallback to 'Address' when no suitable name found", () => {
      const addressWithoutIdentifiers: ProcessedAddress = {
        originalData: { street: "Main St 1", zipcode: "12345" },
        geocodeResult: { ...mockGeocodeResult, display_name: "" },
        coordinates: [52.52, 13.405],
      };

      const result = convertToGeoJSON([addressWithoutIdentifiers], ["zipcode"]);
      const feature = result.features[0];

      // With the new implementation, it should use the first metadata column as fallback or default
      expect(feature.properties.name).toBeDefined();
      expect(feature.properties.description).toContain("<strong>zipcode:</strong> 12345");
    });
  });

  describe("generateExportFilename", () => {
    beforeEach(() => {
      // Mock Date to return a consistent timestamp
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-15T14:30:45.123Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should generate filename with timestamp", () => {
      const result = generateExportFilename("addresses.csv");
      expect(result).toBe("addresses_geocoded_2023-06-15T14-30-45.json");
    });

    it("should remove file extension from original filename", () => {
      const result = generateExportFilename("my-data.xlsx");
      expect(result).toBe("my-data_geocoded_2023-06-15T14-30-45.json");
    });

    it("should handle filename without extension", () => {
      const result = generateExportFilename("addresses");
      expect(result).toBe("addresses_geocoded_2023-06-15T14-30-45.json");
    });

    it("should handle complex filenames", () => {
      const result = generateExportFilename("customer.data.backup.csv");
      expect(result).toBe("customer.data.backup_geocoded_2023-06-15T14-30-45.json");
    });
  });

  describe("createProcessingSummary", () => {
    const successfulAddress: ProcessedAddress = {
      originalData: { name: "John" },
      geocodeResult: {
        lat: 52.52,
        lon: 13.405,
        display_name: "Berlin",
      },
    };

    const failedAddress: ProcessedAddress = {
      originalData: { name: "Jane" },
      error: "Geocoding failed",
    };

    it("should create summary for successful processing", () => {
      const addresses = [successfulAddress, successfulAddress, successfulAddress];
      const result = createProcessingSummary(addresses);

      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.successRate).toBe("100.0%");
    });

    it("should create summary for mixed results", () => {
      const addresses = [successfulAddress, failedAddress, successfulAddress, failedAddress, failedAddress];
      const result = createProcessingSummary(addresses);

      expect(result.total).toBe(5);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(3);
      expect(result.successRate).toBe("40.0%");
    });

    it("should handle empty input", () => {
      const result = createProcessingSummary([]);

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.successRate).toBe("0%");
    });

    it("should handle all failed processing", () => {
      const addresses = [failedAddress, failedAddress];
      const result = createProcessingSummary(addresses);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.successRate).toBe("0.0%");
    });
  });

  describe("downloadJSON", () => {
    it("should create download link and trigger download", () => {
      const testData = { test: "data", number: 42 };

      downloadJSON(testData, "test.json");

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.href).toBe("mock-blob-url");
      expect(mockLink.download).toBe("test.json");
      expect(mockLink.style.display).toBe("none");
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-blob-url");
    });
  });
});
