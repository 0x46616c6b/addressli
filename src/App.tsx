import React, { useCallback, useState } from "react";
import { ColumnSelector } from "./components/ColumnSelector";
import { DataPreview } from "./components/DataPreview";
import { FileUpload } from "./components/FileUpload";
import { ProcessingProgressComponent } from "./components/ProcessingProgress";
import { Results } from "./components/Results";
import type { CSVRow, ColumnMapping, LeafletFeatureCollection, ProcessedAddress, ProcessingProgress } from "./types";
import { parseCSVFile, validateColumnSelection } from "./utils/csvParser";
import { buildAddressString, geocodeAddressWithRateLimit } from "./utils/geocoding";
import { convertToGeoJSON } from "./utils/jsonExport";

type AppStep = "upload" | "preview" | "mapping" | "processing" | "results";

interface AppState {
  currentStep: AppStep;
  csvData: CSVRow[];
  headers: string[];
  selectedFile: File | null;
  columnMapping: ColumnMapping;
  processedAddresses: ProcessedAddress[];
  progress: ProcessingProgress;
  isProcessing: boolean;
  geoJsonData: LeafletFeatureCollection | null;
  errors: string[];
}

const initialState: AppState = {
  currentStep: "upload",
  csvData: [],
  headers: [],
  selectedFile: null,
  columnMapping: { metadataColumns: [] },
  processedAddresses: [],
  progress: { total: 0, processed: 0, successful: 0, failed: 0 },
  isProcessing: false,
  geoJsonData: null,
  errors: [],
};

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>(initialState);

  const setCurrentStep = useCallback((step: AppStep) => {
    setState((prev) => ({ ...prev, currentStep: step, errors: [] }));
  }, []);

  const addError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, errors: [...prev.errors, error] }));
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setState((prev) => ({ ...prev, selectedFile: file, errors: [] }));

      try {
        const result = await parseCSVFile(file);

        if (result.errors.length > 0) {
          console.warn("CSV parse warnings:", result.errors);
        }

        if (result.data.length === 0) {
          addError("Die CSV-Datei enthält keine Daten.");
          return;
        }

        if (result.headers.length === 0) {
          addError("Die CSV-Datei enthält keine Spaltenüberschriften.");
          return;
        }

        setState((prev) => ({
          ...prev,
          csvData: result.data,
          headers: result.headers,
          currentStep: "preview",
        }));
      } catch (error) {
        addError(`Fehler beim Laden der CSV-Datei: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
      }
    },
    [addError]
  );

  const handleMappingChange = useCallback((mapping: ColumnMapping) => {
    setState((prev) => ({ ...prev, columnMapping: mapping }));
  }, []);

  const handleStartProcessing = useCallback(async () => {
    const validation = validateColumnSelection(state.headers, state.columnMapping.zipCode, state.columnMapping.street, state.columnMapping.city);

    if (!validation.isValid) {
      validation.errors.forEach(addError);
      return;
    }

    setCurrentStep("processing");

    // Start processing
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      progress: { total: prev.csvData.length, processed: 0, successful: 0, failed: 0 },
    }));

    const processedAddresses: ProcessedAddress[] = [];

    for (let i = 0; i < state.csvData.length; i++) {
      const row = state.csvData[i];

      // Build address string from selected columns
      const addressString = buildAddressString(
        state.columnMapping.street ? row[state.columnMapping.street] : undefined,
        state.columnMapping.zipCode ? row[state.columnMapping.zipCode] : undefined,
        state.columnMapping.city ? row[state.columnMapping.city] : undefined
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
            processedAddress.error = "Adresse konnte nicht gefunden werden";
          }
        } catch (error) {
          processedAddress.error = error instanceof Error ? error.message : "Geocoding-Fehler";
        }
      } else {
        processedAddress.error = "Leere Adresse";
      }

      processedAddresses.push(processedAddress);

      // Update progress
      setState((prev) => ({
        ...prev,
        progress: {
          total: state.csvData.length,
          processed: i + 1,
          successful: processedAddresses.filter((addr) => addr.geocodeResult && !addr.error).length,
          failed: processedAddresses.filter((addr) => !addr.geocodeResult || addr.error).length,
        },
        processedAddresses: [...processedAddresses],
      }));
    }

    // Generate GeoJSON
    const geoJsonData = convertToGeoJSON(processedAddresses, state.columnMapping.metadataColumns);

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      processedAddresses,
      geoJsonData,
      currentStep: "results",
    }));
  }, [state.headers, state.columnMapping, state.csvData, addError, setCurrentStep]);

  const handleCancelProcessing = useCallback(() => {
    setState((prev) => ({ ...prev, isProcessing: false }));
  }, []);

  const handleStartOver = useCallback(() => {
    setState(initialState);
  }, []);

  const renderStep = () => {
    switch (state.currentStep) {
      case "upload":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Adressli</h1>
              <p className="text-lg text-gray-600 mb-8">CSV-Adressdaten geocodieren für die Nutzung in Karten</p>
            </div>
            <FileUpload onFileSelected={handleFileSelected} />
          </div>
        );

      case "preview":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Datenvorschau</h2>
              <p className="text-gray-600">Überprüfen Sie Ihre Daten und wählen Sie dann die Adressspalten aus</p>
            </div>
            <DataPreview data={state.csvData} headers={state.headers} />
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep("mapping")}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Weiter zur Spaltenauswahl
              </button>
            </div>
          </div>
        );

      case "mapping":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Spalten zuordnen</h2>
              <p className="text-gray-600">Wählen Sie die Spalten für Adressdaten und zusätzliche Metadaten aus</p>
            </div>
            <ColumnSelector headers={state.headers} onMappingChange={handleMappingChange} initialMapping={state.columnMapping} />
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep("preview")}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Zurück
              </button>
              <button
                onClick={handleStartProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={!state.columnMapping.zipCode && !state.columnMapping.street && !state.columnMapping.city}
              >
                Geocoding starten
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Adressen werden geocodiert</h2>
              <p className="text-gray-600">Bitte warten Sie, während die Adressen verarbeitet werden...</p>
            </div>
            <ProcessingProgressComponent progress={state.progress} isProcessing={state.isProcessing} onCancel={handleCancelProcessing} />
          </div>
        );

      case "results":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Geocoding abgeschlossen</h2>
              <p className="text-gray-600">Ihre Adressen wurden erfolgreich verarbeitet</p>
            </div>
            <Results
              processedAddresses={state.processedAddresses}
              originalFilename={state.selectedFile?.name || "addresses"}
              geoJsonData={state.geoJsonData || {}}
              onStartOver={handleStartOver}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {(["upload", "preview", "mapping", "processing", "results"] as const).map((step, index) => {
              const stepLabels = {
                upload: "Upload",
                preview: "Vorschau",
                mapping: "Zuordnung",
                processing: "Verarbeitung",
                results: "Ergebnisse",
              };

              const isActive = state.currentStep === step;
              const isCompleted = ["upload", "preview", "mapping", "processing", "results"].indexOf(state.currentStep) > index;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${isActive ? "bg-blue-600 text-white" : isCompleted ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}
                  `}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}>{stepLabels[step]}</span>
                  {index < 4 && <div className={`ml-4 w-8 h-0.5 ${isCompleted ? "bg-green-600" : "bg-gray-300"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Messages */}
        {state.errors.length > 0 && (
          <div className="mb-6">
            {state.errors.map((error, index) => (
              <div key={index} className="mb-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg p-6">{renderStep()}</div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            Adressli nutzt OpenStreetMap Nominatim für Geocoding. Bitte beachten Sie die{" "}
            <a
              href="https://operations.osmfoundation.org/policies/nominatim/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Nominatim Usage Policy
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
