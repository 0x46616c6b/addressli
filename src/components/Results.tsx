import React from "react";
import type { ProcessedAddress } from "../types";
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

  const handleDownload = () => {
    downloadJSON(geoJsonData, filename);
  };

  const successfulAddresses = processedAddresses.filter((addr) => addr.geocodeResult && !addr.error);
  const failedAddresses = processedAddresses.filter((addr) => !addr.geocodeResult || addr.error);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verarbeitungsergebnisse</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">Gesamt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-gray-500">Erfolgreich</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-gray-500">Fehlgeschlagen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.successRate}</div>
            <div className="text-sm text-gray-500">Erfolgsquote</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            📥 JSON-Datei herunterladen
          </button>
          <button
            onClick={onStartOver}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Neue Datei verarbeiten
          </button>
        </div>
      </div>

      {/* Successful Results Preview */}
      {successfulAddresses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Erfolgreich geocodierte Adressen (Vorschau)</h4>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ursprungsadresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koordinaten</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gefundene Adresse</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {successfulAddresses.slice(0, 5).map((addr, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Object.values(addr.originalData).filter(Boolean).join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {addr.geocodeResult ? `${addr.geocodeResult.lat.toFixed(6)}, ${addr.geocodeResult.lon.toFixed(6)}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{addr.geocodeResult?.display_name || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {successfulAddresses.length > 5 && (
            <p className="mt-3 text-sm text-gray-500 text-center">... und {successfulAddresses.length - 5} weitere erfolgreich geocodierte Adressen</p>
          )}
        </div>
      )}

      {/* Failed Results */}
      {failedAddresses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-base font-medium text-red-800 mb-4">⚠️ Nicht geocodierte Adressen ({failedAddresses.length})</h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {failedAddresses.slice(0, 10).map((addr, index) => (
              <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border">
                <div className="font-medium">{Object.values(addr.originalData).filter(Boolean).join(", ") || "Leere Adresse"}</div>
                {addr.error && <div className="text-xs text-red-600 mt-1">Fehler: {addr.error}</div>}
              </div>
            ))}
          </div>

          {failedAddresses.length > 10 && <p className="mt-3 text-sm text-red-600">... und {failedAddresses.length - 10} weitere fehlgeschlagene Adressen</p>}

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Tipp:</strong> Überprüfen Sie die fehlgeschlagenen Adressen auf Vollständigkeit. Oft fehlen wichtige Informationen wie Straßenname oder
              Ort.
            </p>
          </div>
        </div>
      )}

      {/* Download Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">📄 Über die heruntergeladene Datei</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Format: GeoJSON (kompatibel mit Leaflet und anderen Mapping-Bibliotheken)</li>
          <li>• Koordinaten: WGS84 (EPSG:4326)</li>
          <li>• Dateiname: {filename}</li>
          <li>• Enthält nur erfolgreich geocodierte Adressen</li>
          <li>• Zusätzliche Metadaten sind in den properties-Feldern enthalten</li>
        </ul>
      </div>
    </div>
  );
}
