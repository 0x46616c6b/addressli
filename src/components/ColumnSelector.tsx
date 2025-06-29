import React, { useEffect, useState } from "react";
import type { ColumnMapping } from "../types";

interface ColumnSelectorProps {
  headers: string[];
  onMappingChange: (mapping: ColumnMapping) => void;
  initialMapping?: ColumnMapping;
}

export function ColumnSelector({ headers, onMappingChange, initialMapping }: ColumnSelectorProps): React.JSX.Element {
  const [zipCode, setZipCode] = useState<string>(initialMapping?.zipCode || "");
  const [street, setStreet] = useState<string>(initialMapping?.street || "");
  const [city, setCity] = useState<string>(initialMapping?.city || "");
  const [metadataColumns, setMetadataColumns] = useState<string[]>(initialMapping?.metadataColumns || []);

  useEffect(() => {
    onMappingChange({
      zipCode: zipCode || undefined,
      street: street || undefined,
      city: city || undefined,
      metadataColumns,
    });
  }, [zipCode, street, city, metadataColumns, onMappingChange]);

  const handleMetadataToggle = (column: string) => {
    setMetadataColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const isAddressColumn = (column: string): boolean => {
    return column === zipCode || column === street || column === city;
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Address Columns</h3>
        <p className="text-sm text-gray-600 mb-6">Select the columns that contain your address data. At least one column must be selected.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="zipcode-select" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <select
              id="zipcode-select"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select column --</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="street-select" className="block text-sm font-medium text-gray-700 mb-2">
              Street
            </label>
            <select
              id="street-select"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select column --</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              id="city-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select column --</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-3">Additional Data</h4>
        <p className="text-sm text-gray-600 mb-4">Select additional columns to include in the output file.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {headers.map((header) => (
            <label
              key={header}
              className={`
                flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors
                ${
                  isAddressColumn(header)
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-50"
                    : metadataColumns.includes(header)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <input
                type="checkbox"
                checked={metadataColumns.includes(header)}
                onChange={() => handleMetadataToggle(header)}
                disabled={isAddressColumn(header)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                aria-describedby={isAddressColumn(header) ? `${header}-disabled` : undefined}
              />
              <span className="text-sm text-gray-900 truncate">{header}</span>
              {isAddressColumn(header) && (
                <span id={`${header}-disabled`} className="sr-only">
                  (already selected as address column)
                </span>
              )}
            </label>
          ))}
        </div>

        {metadataColumns.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>{metadataColumns.length}</strong> additional column(s) selected: {metadataColumns.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
