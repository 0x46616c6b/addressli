import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUnloadProtection } from "../useUnloadProtection";

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Store original values
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

describe("useUnloadProtection", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window event listeners
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    // Restore original functions
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it("should not add beforeunload listener when not processing", () => {
    renderHook(() => useUnloadProtection(false));

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  it("should add beforeunload listener when processing starts", () => {
    renderHook(() => useUnloadProtection(true));

    expect(mockAddEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should remove beforeunload listener when processing stops", () => {
    const { rerender } = renderHook(({ isProcessing }) => useUnloadProtection(isProcessing), { initialProps: { isProcessing: true } });

    // Verify listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    // Stop processing
    rerender({ isProcessing: false });

    // Verify listener was removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should remove beforeunload listener on unmount", () => {
    const { unmount } = renderHook(() => useUnloadProtection(true));

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("should use default message when none provided", () => {
    renderHook(() => useUnloadProtection(true));

    // Get the event handler that was registered
    const eventHandler = mockAddEventListener.mock.calls[0][1];

    // Mock BeforeUnloadEvent
    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: "",
    };

    const result = eventHandler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toContain("Data processing is still running");
    expect(result).toContain("Data processing is still running");
  });

  it("should use custom message when provided", () => {
    const customMessage = "Custom warning message";
    renderHook(() => useUnloadProtection(true, customMessage));

    // Get the event handler that was registered
    const eventHandler = mockAddEventListener.mock.calls[0][1];

    // Mock BeforeUnloadEvent
    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: "",
    };

    const result = eventHandler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toBe(customMessage);
    expect(result).toBe(customMessage);
  });
});
