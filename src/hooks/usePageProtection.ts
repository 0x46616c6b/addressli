import type { ProcessingProgress } from "../types";
import { useProcessingTitle } from "./useProcessingTitle";
import { useUnloadProtection } from "./useUnloadProtection";

interface UsePageProtectionOptions {
  isProcessing: boolean;
  progress?: ProcessingProgress;
  originalTitle?: string;
}

/**
 * Composite hook that combines unload protection and title updates during processing.
 *
 * @param options Configuration object
 * @param options.isProcessing Whether data processing is currently active
 * @param options.progress Optional progress information for title updates
 * @param options.originalTitle Optional original title to restore when not processing
 */
export function usePageProtection({ isProcessing, progress, originalTitle = "addressli - CSV Geocoding Tool" }: UsePageProtectionOptions): void {
  useUnloadProtection(isProcessing);
  useProcessingTitle(isProcessing, progress, originalTitle);
}
