import React, { useCallback, useState } from "react";
import { ColumnSelector } from "./components/ColumnSelector";
import { DataPreview } from "./components/DataPreview";
import { FileUpload } from "./components/FileUpload";
import { ProcessingProgressComponent } from "./components/ProcessingProgress";
import { Results } from "./components/Results";
import type { CSVRow, ColumnMapping, LeafletFeatureCollection, ProcessedAddress, ProcessingProgress } from "./types";
import { calculateProgress, isProcessedAddressSuccessful, processAddressRow } from "./utils/addressProcessing";
import { autoDetectColumns, parseCSVFile, validateColumnSelection } from "./utils/csvParser";
import { convertToGeoJSON } from "./utils/jsonExport";

type AppStep = "upload" | "preview" | "processing" | "results";

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
          addError("The CSV file contains no data.");
          return;
        }

        if (result.headers.length === 0) {
          addError("The CSV file contains no column headers.");
          return;
        }

        // Auto-detect column mapping based on common names
        const autoDetectedMapping = autoDetectColumns(result.headers);

        setState((prev) => ({
          ...prev,
          csvData: result.data,
          headers: result.headers,
          columnMapping: {
            ...autoDetectedMapping,
            metadataColumns: [], // Keep empty initially
          },
          currentStep: "preview",
        }));
      } catch (error) {
        addError(`Error loading CSV file: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    let successfulCount = 0;
    let failedCount = 0;

    for (let i = 0; i < state.csvData.length; i++) {
      const row = state.csvData[i];

      // Process the address row
      const processedAddress = await processAddressRow(row, state.columnMapping);
      processedAddresses.push(processedAddress);

      // Update incremental counters
      if (isProcessedAddressSuccessful(processedAddress)) {
        successfulCount++;
      } else {
        failedCount++;
      }

      // Update progress in batches to reduce re-renders
      if ((i + 1) % 10 === 0 || i === state.csvData.length - 1) {
        const progress = calculateProgress(state.csvData.length, i + 1, successfulCount, failedCount);
        setState((prev) => ({
          ...prev,
          progress,
          processedAddresses: [...processedAddresses],
        }));
      }
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
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="text-blue-600 mr-3" aria-hidden="true">🗺️</span>
                adressli
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Transform your CSV address data into map-ready coordinates (GeoJSON).
              </p>
            </div>
            <FileUpload onFileSelected={handleFileSelected} />
          </div>
        );

      case "preview":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Data & Map Columns</h2>
              <p className="text-gray-600">Review your data and select columns for address data and additional metadata</p>
            </div>

            {/* Data Preview Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
              <DataPreview data={state.csvData} headers={state.headers} />
            </div>

            {/* Column Mapping Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Column Mapping</h3>
              <ColumnSelector headers={state.headers} onMappingChange={handleMappingChange} initialMapping={state.columnMapping} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStartProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={!state.columnMapping.zipCode && !state.columnMapping.street && !state.columnMapping.city}
              >
                Start Geocoding
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Geocoding addresses</h2>
              <p className="text-gray-600">Please wait while the addresses are being processed...</p>
            </div>
            <ProcessingProgressComponent progress={state.progress} isProcessing={state.isProcessing} onCancel={handleCancelProcessing} />
          </div>
        );

      case "results":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Geocoding completed</h2>
              <p className="text-gray-600">Your addresses have been successfully processed</p>
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
            {(["upload", "preview", "processing", "results"] as const).map((step, index) => {
              const stepLabels = {
                upload: "Upload",
                preview: "Preview & Map",
                processing: "Processing",
                results: "Results",
              };

              const isActive = state.currentStep === step;
              const isCompleted = ["upload", "preview", "processing", "results"].indexOf(state.currentStep) > index;

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
                  {index < 3 && <div className={`ml-4 w-8 h-0.5 ${isCompleted ? "bg-green-600" : "bg-gray-300"}`} />}
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
            Adressli uses OpenStreetMap Nominatim for geocoding. Please respect the{" "}
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
