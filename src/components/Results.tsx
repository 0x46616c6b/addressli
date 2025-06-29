import React from "react";
import type { ProcessedAddress } from "../types";
import { downloadFailedAddressesCSV } from "../utils/csvParser";
import { createProcessingSummary, downloadJSON, generateExportFilename } from "../utils/jsonExport";

interface ResultsProps {
  processedAddresses: ProcessedAddress[];
  originalFilename: string;
  geoJsonData: object;
  onStartOver: () => void;
}

export function Results({ processedAddresses, originalFilename, geoJsonData, onStartOver }: ResultsProps): React.JSX.Element {
  const summary = createProcessingSummary(processedAddresses);
  const filename = generateExportFilename(originalFilename);
  const failedAddresses = processedAddresses.filter((addr) => !addr.geocodeResult || addr.error);

  const handleDownload = () => {
    downloadJSON(geoJsonData, filename);
  };

  const handleDownloadFailedCSV = () => {
    downloadFailedAddressesCSV(failedAddresses, originalFilename);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing results</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-gray-500">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.successRate}</div>
            <div className="text-sm text-gray-500">Success rate</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            📥 Download JSON file
          </button>
          <button
            onClick={onStartOver}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Process new file
          </button>
        </div>
      </div>

      {/* Failed Results */}
      {failedAddresses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-medium text-red-800">⚠️ Failed addresses ({failedAddresses.length})</h4>
            <button
              onClick={handleDownloadFailedCSV}
              className="bg-red-600 text-white px-3 py-1 text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              📥 Download CSV
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {failedAddresses.slice(0, 10).map((addr, index) => (
              <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border">
                <div className="font-medium">{Object.values(addr.originalData).filter(Boolean).join(", ") || "Empty address"}</div>
                {addr.error && <div className="text-xs text-red-600 mt-1">Error: {addr.error}</div>}
              </div>
            ))}
          </div>

          {failedAddresses.length > 10 && <p className="mt-3 text-sm text-red-600">... and {failedAddresses.length - 10} more failed addresses</p>}
        </div>
      )}

      {/* Download Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">📄 Download Information</h4>
        <p className="text-sm text-blue-700">
          GeoJSON file contains {summary.successful} successfully geocoded addresses • Compatible with Leaflet and mapping libraries
        </p>
      </div>
    </div>
  );
}
