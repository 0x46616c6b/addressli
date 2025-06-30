import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProcessingProgress } from "../../types";
import { useProcessingTitle } from "../useProcessingTitle";

// Store original title
const originalTitle = document.title;

describe("useProcessingTitle", () => {
  beforeEach(() => {
    // Reset document title
    document.title = "Test Title";
  });

  afterEach(() => {
    // Restore original title
    document.title = originalTitle;
  });

  it("should set original title when not processing", () => {
    const customTitle = "My App";
    renderHook(() => useProcessingTitle(false, undefined, customTitle));

    expect(document.title).toBe(customTitle);
  });

  it("should use default title when not processing and no custom title provided", () => {
    renderHook(() => useProcessingTitle(false));

    expect(document.title).toBe("addressli - CSV Geocoding Tool");
  });

  it("should set generic processing title when processing without progress", () => {
    renderHook(() => useProcessingTitle(true));

    expect(document.title).toBe("🔄 Processing... - addressli");
  });

  it("should set progress title when processing with progress data", () => {
    const progress: ProcessingProgress = {
      total: 100,
      processed: 25,
      successful: 20,
      failed: 5,
    };

    renderHook(() => useProcessingTitle(true, progress));

    expect(document.title).toBe("🔄 25% (25/100) - addressli");
  });

  it("should update title when progress changes", () => {
    const initialProgress: ProcessingProgress = {
      total: 100,
      processed: 25,
      successful: 20,
      failed: 5,
    };

    const { rerender } = renderHook(({ progress }) => useProcessingTitle(true, progress), { initialProps: { progress: initialProgress } });

    expect(document.title).toBe("🔄 25% (25/100) - addressli");

    // Update progress
    const updatedProgress: ProcessingProgress = {
      total: 100,
      processed: 50,
      successful: 45,
      failed: 5,
    };

    rerender({ progress: updatedProgress });

    expect(document.title).toBe("🔄 50% (50/100) - addressli");
  });

  it("should restore original title when processing stops", () => {
    const customTitle = "My App";
    const { rerender } = renderHook(({ isProcessing }) => useProcessingTitle(isProcessing, undefined, customTitle), { initialProps: { isProcessing: true } });

    expect(document.title).toBe("🔄 Processing... - addressli");

    rerender({ isProcessing: false });

    expect(document.title).toBe(customTitle);
  });

  it("should handle zero total in progress calculation", () => {
    const progress: ProcessingProgress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
    };

    renderHook(() => useProcessingTitle(true, progress));

    expect(document.title).toBe("🔄 0% (0/0) - addressli");
  });

  it("should restore title on unmount during processing", () => {
    const customTitle = "My App";
    const { unmount } = renderHook(() => useProcessingTitle(true, undefined, customTitle));

    expect(document.title).toBe("🔄 Processing... - addressli");

    unmount();

    // Now that cleanup is properly implemented, the title should be restored
    expect(document.title).toBe(customTitle);
  });
});
