import type { CSVRow, ColumnMapping, ProcessedAddress } from "../types";
import { buildAddressString, geocodeAddressWithRateLimit } from "./geocoding";

/**
 * Processes a single CSV row to create a geocoded address
 */
export async function processAddressRow(row: CSVRow, columnMapping: ColumnMapping): Promise<ProcessedAddress> {
  const addressString = buildAddressString(
    columnMapping.street ? row[columnMapping.street] : undefined,
    columnMapping.zipCode ? row[columnMapping.zipCode] : undefined,
    columnMapping.city ? row[columnMapping.city] : undefined
  );

  const processedAddress: ProcessedAddress = {
    originalData: row,
  };

  if (addressString.trim()) {
    try {
      const geocodeResult = await geocodeAddressWithRateLimit(addressString);

      if (geocodeResult) {
        processedAddress.geocodeResult = geocodeResult;
        processedAddress.coordinates = [geocodeResult.lat, geocodeResult.lon];
      } else {
        processedAddress.error = "Address could not be found";
      }
    } catch (error) {
      processedAddress.error = error instanceof Error ? error.message : "Geocoding error";
    }
  } else {
    processedAddress.error = "Empty address";
  }

  return processedAddress;
}

/**
 * Calculates processing progress statistics incrementally
 */
export function calculateProgress(total: number, processed: number, successful: number, failed: number) {
  return {
    total,
    processed,
    successful,
    failed,
  };
}

/**
 * Determines if a processed address was successful
 */
export function isProcessedAddressSuccessful(processedAddress: ProcessedAddress): boolean {
  return !!(processedAddress.geocodeResult && !processedAddress.error);
}
