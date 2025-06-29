import React, { useCallback, useState } from "react";
import { isValidCSVFile } from "../utils/csvParser";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileSelected, isLoading = false }: FileUploadProps): React.JSX.Element {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      if (!isValidCSVFile(file)) {
        setError("Bitte wählen Sie eine gültige CSV-Datei aus (.csv oder .txt)");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("Die Datei ist zu groß. Maximale Dateigröße: 10MB");
        return;
      }

      setError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${isLoading ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInput}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="CSV-Datei auswählen"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">{dragActive ? "Datei hier ablegen" : "CSV-Datei hochladen"}</p>
            <p className="text-sm text-gray-500">Ziehen Sie eine CSV-Datei hierher oder klicken Sie zum Auswählen</p>
            <p className="text-xs text-gray-400 mt-2">Unterstützte Formate: .csv, .txt (max. 10MB)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
}
