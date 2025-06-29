import Papa from "papaparse";
import type { CSVRow } from "../types";

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
 * @returns Object with validation results
 */
export function validateColumnSelection(headers: string[], zipCode?: string, street?: string, city?: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!headers.length) {
    errors.push("Keine Spaltenüberschriften gefunden");
  }

  // At least one address component should be selected
  if (!zipCode && !street && !city) {
    errors.push("Mindestens eine Adresskomponente (PLZ, Straße oder Ort) muss ausgewählt werden");
  }

  // Check if selected columns exist in headers
  const selectedColumns = [zipCode, street, city].filter(Boolean) as string[];
  const invalidColumns = selectedColumns.filter((col) => !headers.includes(col));

  if (invalidColumns.length > 0) {
    errors.push(`Ungültige Spalten ausgewählt: ${invalidColumns.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
