import type { AddressData, LeafletFeature, LeafletFeatureCollection, ProcessedAddress } from "../types";

/**
 * Extracts the best available city representation from Nominatim address data
 * @param address Address object from geocoding result
 * @returns Formatted city string with postcode if available
 */
export function extractCityFromAddress(address: AddressData): string {
  const cityParts: string[] = [];

  // Add postcode first if available
  if (address.postcode?.trim()) {
    cityParts.push(address.postcode.trim());
  }

  // Try to find the most specific city-like component in order of preference
  const cityComponents = [address.city, address.town, address.village, address.municipality, address.county, address.suburb];

  for (const component of cityComponents) {
    if (component?.trim()) {
      cityParts.push(component.trim());
      break; // Use the first available component
    }
  }

  return cityParts.join(" ");
}

/**
 * Constructs a clean display name from address components
 * @param address Address object from geocoding result
 * @returns Formatted display name string
 */
function constructDisplayName(address: AddressData): string {
  const addressParts: string[] = [];

  // Build street address (road + house number)
  const streetParts: string[] = [];
  if (address.road?.trim()) {
    streetParts.push(address.road.trim());
  }
  if (address.house_number?.trim()) {
    streetParts.push(address.house_number.trim());
  }

  if (streetParts.length > 0) {
    addressParts.push(streetParts.join(" "));
  }

  // Build city part using the extracted city function
  const cityString = extractCityFromAddress(address);
  if (cityString.trim()) {
    addressParts.push(cityString);
  }

  // Fallback to any available address component
  if (addressParts.length === 0) {
    const fallbackComponents = [address.village, address.town, address.suburb, address.state, address.country].filter((component) => component?.trim());

    if (fallbackComponents.length > 0) {
      addressParts.push(fallbackComponents[0]!.trim());
    }
  }

  return addressParts.join(", ");
}

/**
 * Converts processed addresses to GeoJSON format compatible with uMap and Leaflet
 * @param processedAddresses Array of processed addresses
 * @param metadataColumns Columns to include as properties
 * @returns LeafletFeatureCollection
 */
export function convertToGeoJSON(processedAddresses: ProcessedAddress[], metadataColumns: string[] = []): LeafletFeatureCollection {
  const features: LeafletFeature[] = processedAddresses
    .filter((addr) => addr.geocodeResult && !addr.error)
    .map((addr) => {
      if (!addr.geocodeResult) {
        throw new Error("Geocode result is required");
      }

      const properties: Record<string, string | number | boolean | null> = {};

      // Add metadata columns
      metadataColumns.forEach((column) => {
        if (addr.originalData[column] !== undefined) {
          const value = addr.originalData[column];
          // Try to parse as number, otherwise keep as string
          const numValue = Number(value);
          properties[column] = !isNaN(numValue) && value.trim() !== "" ? numValue : value;
        }
      });

      const address = addr.geocodeResult.address || {};
      const displayName = constructDisplayName(address);

      // Generate uMap-compatible title and description
      const uMapData = generateUMapProperties(addr.originalData, metadataColumns, displayName);
      properties.name = uMapData.name;
      properties.description = uMapData.description;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [addr.geocodeResult.lon, addr.geocodeResult.lat], // GeoJSON uses [lon, lat]
        },
        properties,
      };
    });

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Generates uMap-compatible name and description from address data
 * @param originalData The original CSV row data
 * @param metadataColumns Selected metadata columns
 * @param displayName Geocoded display name
 * @returns Object with name and description for uMap
 */
function generateUMapProperties(originalData: Record<string, string>, metadataColumns: string[], displayName?: string): { name: string; description: string } {
  // Try to find a suitable name from common name/company columns
  const nameColumns = ["name", "firma", "company", "unternehmen", "organisation", "organization", "title", "bezeichnung"];
  let name = "";

  // Look for a name column (case-insensitive)
  for (const col of nameColumns) {
    const foundCol = Object.keys(originalData).find((key) => key.toLowerCase().includes(col));
    if (foundCol && originalData[foundCol]?.trim()) {
      name = originalData[foundCol].trim();
      break;
    }
  }

  // If no name found, use the geocoded address as name
  if (!name && displayName) {
    name = displayName;
  }

  // If still no name, use the first non-empty metadata column
  if (!name && metadataColumns.length > 0) {
    for (const col of metadataColumns) {
      if (originalData[col]?.trim()) {
        name = originalData[col].trim();
        break;
      }
    }
  }

  // Fallback name
  if (!name) {
    name = "Address";
  }

  // Generate description from metadata
  let description = "";
  if (metadataColumns.length > 0) {
    const descriptionParts: string[] = [];

    metadataColumns.forEach((column) => {
      const value = originalData[column];
      if (value && value.trim()) {
        descriptionParts.push(`<strong>${column}:</strong> ${value.trim()}`);
      }
    });

    if (descriptionParts.length > 0) {
      description = descriptionParts.join("<br>");
    }
  }

  // Add geocoded address if available and not already used as name
  if (displayName && displayName !== name) {
    if (description) {
      description += "<br><br>";
    }
    description += `<strong>Address:</strong> ${displayName}`;
  }

  // Fallback description
  if (!description) {
    description = name;
  }

  return { name, description };
}

/**
 * Downloads a JSON object as a file
 * @param data The data to download
 * @param filename The filename for the download
 */
export function downloadJSON(data: object, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generates a filename based on the current date and original filename
 * @param originalFilename Original CSV filename
 * @returns Generated filename for the JSON export
 */
export function generateExportFilename(originalFilename: string): string {
  const baseName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  return `${baseName}_geocoded_${timestamp}.json`;
}

/**
 * Creates a summary of the processing results
 * @param processedAddresses Array of processed addresses
 * @returns Summary object
 */
export function createProcessingSummary(processedAddresses: ProcessedAddress[]): {
  total: number;
  successful: number;
  failed: number;
  successRate: string;
} {
  const total = processedAddresses.length;
  const successful = processedAddresses.filter((addr) => addr.geocodeResult && !addr.error).length;
  const failed = total - successful;
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) + "%" : "0%";

  return {
    total,
    successful,
    failed,
    successRate,
  };
}
