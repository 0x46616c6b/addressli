import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { buildAddressString, geocodeAddress } from "../geocoding";

// Mock fetch
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe("geocoding utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildAddressString", () => {
    it("should build address string from all components", () => {
      const result = buildAddressString("Musterstraße 1", "12345", "Berlin");
      expect(result).toBe("Musterstraße 1, 12345, Berlin");
    });

    it("should handle missing components", () => {
      const result = buildAddressString(undefined, "12345", "Berlin");
      expect(result).toBe("12345, Berlin");
    });

    it("should handle empty strings", () => {
      const result = buildAddressString("", "12345", "Berlin");
      expect(result).toBe("12345, Berlin");
    });

    it("should return empty string when all components are missing", () => {
      const result = buildAddressString();
      expect(result).toBe("");
    });

    it("should trim whitespace from components", () => {
      const result = buildAddressString("  Musterstraße 1  ", "  12345  ", "  Berlin  ");
      expect(result).toBe("Musterstraße 1, 12345, Berlin");
    });
  });

  describe("geocodeAddress", () => {
    it("should return null for empty address", async () => {
      const result = await geocodeAddress("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only address", async () => {
      const result = await geocodeAddress("   ");
      expect(result).toBeNull();
    });

    it("should return geocode result for valid response", async () => {
      const mockResponse = [
        {
          lat: "52.5200",
          lon: "13.4050",
          display_name: "Berlin, Deutschland",
          address: {
            city: "Berlin",
            country: "Deutschland",
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await geocodeAddress("Berlin");

      expect(result).toEqual({
        lat: 52.52,
        lon: 13.405,
        display_name: "Berlin, Deutschland",
        address: {
          city: "Berlin",
          country: "Deutschland",
        },
      });
    });

    it("should return null for empty response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const result = await geocodeAddress("Nonexistent Address");
      expect(result).toBeNull();
    });

    it("should return null on fetch error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await geocodeAddress("Berlin");
      expect(result).toBeNull();
    });

    it("should return null on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await geocodeAddress("Berlin");
      expect(result).toBeNull();
    });

    it("should use correct request parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      await geocodeAddress("Berlin, Deutschland");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://nominatim.openstreetmap.org/search"),
        expect.objectContaining({
          headers: {
            "User-Agent": "Adressli/1.0 (CSV Address Processor)",
          },
        })
      );

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit?];
      expect(url).toContain("q=Berlin%2C+Deutschland"); // URLSearchParams uses + for spaces
      expect(url).toContain("format=json");
      expect(url).toContain("addressdetails=1");
      expect(url).toContain("limit=1");
    });
  });
});
