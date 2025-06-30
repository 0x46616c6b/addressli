import { useEffect } from "react";

/**
 * Custom hook that prevents page reload during processing by showing a confirmation dialog.
 *
 * @param isProcessing Whether data processing is currently active
 * @param message Optional custom message for the confirmation dialog
 */
export function useUnloadProtection(
  isProcessing: boolean,
  message = "Data processing is still running. Are you sure you want to leave this page? This will interrupt the process."
): void {
  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): string | undefined => {
      // Modern browsers require returnValue to be set and a string to be returned
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
  }, [isProcessing, message]);
}
