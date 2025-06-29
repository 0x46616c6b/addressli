import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CSVRow, ColumnMapping, ProcessedAddress } from "../../types";
import { calculateProgress, isProcessedAddressSuccessful, processAddressRow } from "../addressProcessing";
import * as geocoding from "../geocoding";

// Mock the geocoding module
vi.mock("../geocoding", () => ({
  buildAddressString: vi.fn(),
  geocodeAddressWithRateLimit: vi.fn(),
}));

describe("addressProcessing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processAddressRow", () => {
    const mockRow: CSVRow = {
      street: "123 Main St",
      city: "Test City",
      zip: "12345",
      name: "Test Location",
    };

    const mockColumnMapping: ColumnMapping = {
      street: "street",
      city: "city",
      zipCode: "zip",
      metadataColumns: ["name"],
    };

    it("should process a valid address successfully", async () => {
      const mockGeocodeResult = {
        lat: 40.7128,
        lon: -74.006,
        display_name: "123 Main St, Test City, 12345",
      };

      vi.mocked(geocoding.buildAddressString).mockReturnValue("123 Main St, Test City, 12345");
      vi.mocked(geocoding.geocodeAddressWithRateLimit).mockResolvedValue(mockGeocodeResult);

      const result = await processAddressRow(mockRow, mockColumnMapping);

      expect(result).toEqual({
        originalData: mockRow,
        geocodeResult: mockGeocodeResult,
        coordinates: [40.7128, -74.006],
      });
    });

    it("should handle geocoding failure", async () => {
      vi.mocked(geocoding.buildAddressString).mockReturnValue("123 Main St, Test City, 12345");
      vi.mocked(geocoding.geocodeAddressWithRateLimit).mockResolvedValue(null);

      const result = await processAddressRow(mockRow, mockColumnMapping);

      expect(result).toEqual({
        originalData: mockRow,
        error: "Address could not be found",
      });
    });

    it("should handle geocoding error", async () => {
      vi.mocked(geocoding.buildAddressString).mockReturnValue("123 Main St, Test City, 12345");
      vi.mocked(geocoding.geocodeAddressWithRateLimit).mockRejectedValue(new Error("Network error"));

      const result = await processAddressRow(mockRow, mockColumnMapping);

      expect(result).toEqual({
        originalData: mockRow,
        error: "Network error",
      });
    });

    it("should handle empty address", async () => {
      vi.mocked(geocoding.buildAddressString).mockReturnValue("");

      const result = await processAddressRow(mockRow, mockColumnMapping);

      expect(result).toEqual({
        originalData: mockRow,
        error: "Empty address",
      });
    });
  });

  describe("calculateProgress", () => {
    it("should calculate progress correctly with incremental counters", () => {
      const result = calculateProgress(10, 5, 3, 2);

      expect(result).toEqual({
        total: 10,
        processed: 5,
        successful: 3,
        failed: 2,
      });
    });

    it("should handle zero counts", () => {
      const result = calculateProgress(10, 0, 0, 0);

      expect(result).toEqual({
        total: 10,
        processed: 0,
        successful: 0,
        failed: 0,
      });
    });
  });

  describe("isProcessedAddressSuccessful", () => {
    it("should return true for successful address", () => {
      const processedAddress: ProcessedAddress = {
        originalData: {},
        geocodeResult: { lat: 1, lon: 1, display_name: "Test" },
        coordinates: [1, 1],
      };

      expect(isProcessedAddressSuccessful(processedAddress)).toBe(true);
    });

    it("should return false for address with error", () => {
      const processedAddress: ProcessedAddress = {
        originalData: {},
        error: "Failed",
      };

      expect(isProcessedAddressSuccessful(processedAddress)).toBe(false);
    });

    it("should return false for address without geocode result", () => {
      const processedAddress: ProcessedAddress = {
        originalData: {},
      };

      expect(isProcessedAddressSuccessful(processedAddress)).toBe(false);
    });

    it("should return false for address with geocode result but also error", () => {
      const processedAddress: ProcessedAddress = {
        originalData: {},
        geocodeResult: { lat: 1, lon: 1, display_name: "Test" },
        coordinates: [1, 1],
        error: "Some error",
      };

      expect(isProcessedAddressSuccessful(processedAddress)).toBe(false);
    });
  });
});
