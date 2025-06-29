import type { LeafletFeature, LeafletFeatureCollection, ProcessedAddress } from "../types";

/**
 * Converts processed addresses to GeoJSON format for Leaflet
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

      // Add geocoding information
      properties.display_name = addr.geocodeResult.display_name || null;
      properties.geocode_success = true;

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
