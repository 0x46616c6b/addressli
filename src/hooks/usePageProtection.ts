import { useEffect } from "react";
import type { ProcessingProgress } from "../types";

interface UsePageProtectionOptions {
  isProcessing: boolean;
  progress?: ProcessingProgress;
  originalTitle?: string;
}

/**
 * Custom hook that prevents page reload during processing and updates the page title
 * to show processing progress in the browser tab.
 *
 * @param options Configuration object
 * @param options.isProcessing Whether data processing is currently active
 * @param options.progress Optional progress information for title updates
 * @param options.originalTitle Optional original title to restore when not processing
 */
export function usePageProtection({ isProcessing, progress, originalTitle = "addressli - CSV Geocoding Tool" }: UsePageProtectionOptions): void {
  // Prevent page reload during processing
  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): string | undefined => {
      // Modern browsers require returnValue to be set and a string to be returned
      const message = "Data processing is still running. Are you sure you want to leave this page? This will interrupt the process.";
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    // Add event listener when processing starts
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup: Remove event listener when processing ends or component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProcessing]);

  // Update page title based on processing state
  useEffect(() => {
    if (!isProcessing) {
      // Restore original title when not processing
      document.title = originalTitle;
      return;
    }

    if (!progress) {
      // Generic processing title when no progress info available
      document.title = "🔄 Processing... - addressli";
      return;
    }

    // Calculate percentage for title
    const percentage = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

    // Update title with progress information
    document.title = `🔄 ${percentage}% (${progress.processed}/${progress.total}) - addressli`;

    // Cleanup: Restore original title when component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [isProcessing, progress, originalTitle]);
}
