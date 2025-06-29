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
      expect(feature.properties.display_name).toBe("Berlin, Deutschland");
      expect(feature.properties.geocode_success).toBe(true);
    });

    it("should filter out failed addresses", () => {
      const result = convertToGeoJSON([successfulAddress, failedAddress], ["name"]);

      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.name).toBe("John");
    });

    it("should handle empty metadata columns", () => {
      const result = convertToGeoJSON([successfulAddress], []);

      const feature = result.features[0];
      expect(feature.properties.name).toBeUndefined();
      expect(feature.properties.display_name).toBe("Berlin, Deutschland");
      expect(feature.properties.geocode_success).toBe(true);
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
