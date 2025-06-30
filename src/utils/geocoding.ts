import type { GeocodeResult } from "../types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests as per Nominatim usage policy

/**
 * Geocodes an address using the Nominatim OpenStreetMap API
 * @param address The address string to geocode
 * @returns Promise<GeocodeResult | null>
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address.trim()) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      addressdetails: "1",
      limit: "1",
      "accept-language": "de,en",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      headers: {
        "User-Agent": "addressli/1.0 (CSV Address Processor)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Builds an address string from individual components
 * @param street Street address
 * @param zipCode ZIP/postal code
 * @param city City name
 * @param country Country name
 * @returns Formatted address string
 */
export function buildAddressString(street?: string, zipCode?: string, city?: string, country?: string): string {
  const parts = [street, zipCode, city, country].filter((part) => part?.trim()).map((part) => part!.trim());
  return parts.join(", ");
}

/**
 * Adds a delay between API calls to respect rate limiting
 * @param ms Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocodes an address with rate limiting
 * @param address Address to geocode
 * @returns Promise<GeocodeResult | null>
 */
export async function geocodeAddressWithRateLimit(address: string): Promise<GeocodeResult | null> {
  const result = await geocodeAddress(address);
  await delay(RATE_LIMIT_DELAY);
  return result;
}
