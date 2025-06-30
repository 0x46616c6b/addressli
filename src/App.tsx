import React, { useCallback, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ColumnSelector } from "./components/ColumnSelector";
import { DataPreview } from "./components/DataPreview";
import { FileUpload } from "./components/FileUpload";
import { MultiStepIndicator, type AppStep } from "./components/MultiStepIndicator";
import { ProcessingProgressComponent } from "./components/ProcessingProgress";
import { Results } from "./components/Results";
import { usePageProtection } from "./hooks";
import type { CSVRow, ColumnMapping, LeafletFeatureCollection, ProcessedAddress, ProcessingProgress } from "./types";
import { calculateProgress, isProcessedAddressSuccessful, processAddressRow } from "./utils/addressProcessing";
import { autoDetectColumns, parseCSVFile, validateColumnSelection } from "./utils/csvParser";
import { convertToGeoJSON } from "./utils/jsonExport";

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

  // Protect page from reload during processing and update title
  usePageProtection({
    isProcessing: state.isProcessing,
    progress: state.progress,
  });

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
        return <FileUpload onFileSelected={handleFileSelected} />;

      case "preview":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Preview & Map Columns</h2>
              <p className="text-gray-600">Review your data and map the address columns</p>
            </div>

            <div className="space-y-8">
              {/* Data Preview Section */}
              <section className="space-y-4" aria-labelledby="data-preview-heading">
                <DataPreview data={state.csvData} headers={state.headers} />
              </section>

              {/* Column Mapping Section */}
              <section className="space-y-4" aria-labelledby="address-columns-heading">
                <ColumnSelector headers={state.headers} onMappingChange={handleMappingChange} initialMapping={state.columnMapping} />
              </section>

              {/* Action Button */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleStartProcessing}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  disabled={!state.columnMapping.zipCode && !state.columnMapping.street && !state.columnMapping.city}
                >
                  Start Geocoding
                </button>
              </div>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Geocoding addresses</h2>
              <p className="text-gray-600">Please wait while the addresses are being processed...</p>
            </div>
            <ProcessingProgressComponent progress={state.progress} isProcessing={state.isProcessing} onCancel={handleCancelProcessing} />
          </div>
        );

      case "results":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Geocoding completed</h2>
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
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        {/* App Header - Outside Card */}
        <AppHeader className="mb-6 sm:mb-8" />

        {/* Error Messages */}
        {state.errors.length > 0 && (
          <div className="mb-4 sm:mb-6">
            {state.errors.map((error, index) => (
              <div key={index} className="mb-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Multi-Step Indicator - Inside Card */}
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
            <MultiStepIndicator currentStep={state.currentStep} />
          </div>

          {/* Step Content */}
          <div className="p-4 sm:p-6 lg:p-8">{renderStep()}</div>
        </div>

        {/* Footer */}
        <footer className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>
            addressli uses OpenStreetMap Nominatim for geocoding. Please respect the{" "}
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
