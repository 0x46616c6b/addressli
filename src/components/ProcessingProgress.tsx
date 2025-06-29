import React from "react";
import type { ProcessingProgress } from "../types";

interface ProcessingProgressProps {
  progress: ProcessingProgress;
  isProcessing: boolean;
  onCancel?: () => void;
}

export function ProcessingProgressComponent({ progress, isProcessing, onCancel }: ProcessingProgressProps): React.JSX.Element {
  const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  const successRate = progress.processed > 0 ? (progress.successful / progress.processed) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{isProcessing ? "Processing..." : "Processing completed"}</h3>
        <p className="text-sm text-gray-600">
          {progress.processed} of {progress.total} addresses processed
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isProcessing ? "bg-blue-500" : "bg-green-500"}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${percentage.toFixed(1)}%`}
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white p-3 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-3 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{progress.processed}</div>
          <div className="text-sm text-gray-500">Processed</div>
        </div>
        <div className="bg-white p-3 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
          <div className="text-sm text-gray-500">Successful</div>
        </div>
        <div className="bg-white p-3 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>

      {/* Success Rate */}
      {progress.processed > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Success rate:</span>
            <span className={`text-sm font-bold ${successRate >= 80 ? "text-green-600" : successRate >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {successRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                successRate >= 80 ? "bg-green-500" : successRate >= 60 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {isProcessing && onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Cancel processing
          </button>
        </div>
      )}

      {/* Status Messages */}
      <div className="text-center">
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm">Geocoding in progress... Please be patient.</span>
          </div>
        )}

        {!isProcessing && progress.processed > 0 && (
          <div className="text-sm text-gray-600">
            {progress.failed > 0 && <p className="text-yellow-600 mb-2">⚠️ {progress.failed} addresses could not be geocoded.</p>}
            <p>Processing is complete. You can now download the results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
