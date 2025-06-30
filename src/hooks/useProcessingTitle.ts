import { useEffect } from "react";
import type { ProcessingProgress } from "../types";

/**
 * Custom hook that updates the page title to show processing progress.
 *
 * @param isProcessing Whether data processing is currently active
 * @param progress Optional progress information for detailed title updates
 * @param originalTitle The title to restore when not processing
 */
export function useProcessingTitle(isProcessing: boolean, progress?: ProcessingProgress, originalTitle = "addressli - CSV Geocoding Tool"): void {
  useEffect(() => {
    if (!isProcessing) {
      document.title = originalTitle;
      return;
    }

    if (!progress) {
      document.title = "🔄 Processing... - addressli";
    } else {
      const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
      document.title = `🔄 ${percentage}% (${progress.processed}/${progress.total}) - addressli`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [isProcessing, progress, originalTitle]);
}
