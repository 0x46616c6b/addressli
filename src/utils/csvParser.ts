import Papa from "papaparse";
import type { CSVRow, ProcessedAddress } from "../types";

export interface CSVParseResult {
  data: CSVRow[];
  headers: string[];
  errors: Papa.ParseError[];
}

/**
 * Parses a CSV file and returns the data with headers
 * @param file The CSV file to parse
 * @returns Promise<CSVParseResult>
 */
export function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          data: results.data as CSVRow[],
          headers,
          errors: results.errors,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Validates if a file is a valid CSV file
 * @param file The file to validate
 * @returns boolean
 */
export function isValidCSVFile(file: File): boolean {
  const validTypes = ["text/csv", "application/csv", "text/plain"];
  const validExtensions = [".csv", ".txt"];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  return hasValidType || hasValidExtension;
}

/**
 * Gets a preview of the CSV data (first n rows)
 * @param data Array of CSV rows
 * @param maxRows Maximum number of rows to return
 * @returns Array of CSV rows
 */
export function getCSVPreview(data: CSVRow[], maxRows: number = 5): CSVRow[] {
  return data.slice(0, maxRows);
}

/**
 * Validates if the required columns are selected
 * @param headers Available column headers
 * @param zipCode Selected ZIP code column
 * @param street Selected street column
 * @param city Selected city column
 * @param country Selected country column
 * @returns Object with validation results
 */
export function validateColumnSelection(
  headers: string[],
  zipCode?: string,
  street?: string,
  city?: string,
  country?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!headers.length) {
    errors.push("No column headers found");
  }

  // At least one address component should be selected
  if (!zipCode && !street && !city && !country) {
    errors.push("At least one address component (ZIP, street, city, or country) must be selected");
  }

  // Check if selected columns exist in headers
  const selectedColumns = [zipCode, street, city, country].filter(Boolean) as string[];
  const invalidColumns = selectedColumns.filter((col) => !headers.includes(col));

  if (invalidColumns.length > 0) {
    errors.push(`Invalid columns selected: ${invalidColumns.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Automatically detects address columns based on common German and English column names
 * @param headers Available column headers
 * @returns Suggested column mapping
 */
export function autoDetectColumns(headers: string[]): { zipCode?: string; street?: string; city?: string; country?: string } {
  const normalizedHeaders = headers.map((header) => header.toLowerCase().trim());

  // Common patterns for ZIP code columns (German and English)
  const zipPatterns = ["plz", "postleitzahl", "zip", "zipcode", "zip code", "postal code", "postalcode", "zip-code", "post code", "postcode", "postal_code"];

  // Common patterns for street columns (German and English)
  const streetPatterns = [
    "straße",
    "strasse",
    "str",
    "street",
    "address",
    "adresse",
    "anschrift",
    "hausnummer",
    "streetaddress",
    "street address",
    "street_address",
    "addr",
    "strasse_hausnummer",
    "straße_hausnummer",
    "straßeundnummer",
    "addressline",
    "address line",
  ];

  // Common patterns for city columns (German and English)
  const cityPatterns = ["ort", "stadt", "city", "town", "place", "gemeinde", "municipality", "ortschaft", "wohnort", "locality", "location", "standort"];

  // Common patterns for country columns (German and English)
  const countryPatterns = ["land", "country", "staat", "nation", "ländercode", "country code", "country_code", "countrycode", "iso_country", "iso country"];

  const findBestMatch = (patterns: string[]) => {
    // First, try to find exact matches
    for (const pattern of patterns) {
      const exactMatchIndex = normalizedHeaders.findIndex((header) => header === pattern);
      if (exactMatchIndex !== -1) {
        return headers[exactMatchIndex]; // Return original header (with correct casing)
      }
    }

    // If no exact match found, look for partial matches
    for (const pattern of patterns) {
      const partialMatchIndex = normalizedHeaders.findIndex((header) => header.includes(pattern));
      if (partialMatchIndex !== -1) {
        return headers[partialMatchIndex]; // Return original header (with correct casing)
      }
    }

    return undefined;
  };

  return {
    zipCode: findBestMatch(zipPatterns),
    street: findBestMatch(streetPatterns),
    city: findBestMatch(cityPatterns),
    country: findBestMatch(countryPatterns),
  };
}

/**
 * Converts failed addresses to CSV format and downloads it
 * @param failedAddresses Array of failed processed addresses
 * @param originalFilename Original CSV filename for generating the new filename
 */
export function downloadFailedAddressesCSV(failedAddresses: ProcessedAddress[], originalFilename: string): void {
  if (failedAddresses.length === 0) {
    return;
  }

  // Get all unique column names from the original data, preserving order of first appearance
  const allColumns: string[] = [];
  const seenColumns = new Set<string>();

  failedAddresses.forEach((addr) => {
    Object.keys(addr.originalData).forEach((key) => {
      if (!seenColumns.has(key)) {
        allColumns.push(key);
        seenColumns.add(key);
      }
    });
  });

  const headers = allColumns;

  // Prepare data without error messages - just the original data
  const csvData = failedAddresses.map((addr) => {
    return { ...addr.originalData };
  });

  // Convert to CSV string
  const csvString = Papa.unparse({
    fields: headers,
    data: csvData,
  });

  // Generate filename
  const baseName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `${baseName}_failed_addresses_${timestamp}.csv`;

  // Download the file
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
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
