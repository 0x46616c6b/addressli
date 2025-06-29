import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MultiStepIndicator } from "../MultiStepIndicator";

describe("MultiStepIndicator", () => {
  it("renders all steps with correct labels", () => {
    render(<MultiStepIndicator currentStep="upload" />);

    expect(screen.getAllByText("Upload")).toHaveLength(2); // Mobile + Desktop
    expect(screen.getAllByText("Preview & Map")).toHaveLength(2);
    expect(screen.getAllByText("Processing")).toHaveLength(2);
    expect(screen.getAllByText("Results")).toHaveLength(2);
  });

  it("marks the current step as active", () => {
    render(<MultiStepIndicator currentStep="preview" />);

    const activeStepElements = screen.getAllByText("Preview & Map");
    activeStepElements.forEach((element) => {
      expect(element).toHaveClass("text-blue-600", "font-medium");
    });
  });

  it("marks completed steps correctly", () => {
    render(<MultiStepIndicator currentStep="processing" />);

    // Upload and Preview should be completed (show checkmark)
    // 2 completed steps × 2 views (mobile + desktop) = 4 checkmarks
    const completedSteps = screen.getAllByText("✓");
    expect(completedSteps).toHaveLength(4);
  });

  it("shows step numbers for future steps", () => {
    render(<MultiStepIndicator currentStep="upload" />);

    // Should show numbers 1, 2, 3, 4 for all steps since none are completed
    expect(screen.getAllByText("1")).toHaveLength(2); // Current step shown in both views
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getAllByText("3")).toHaveLength(2);
    expect(screen.getAllByText("4")).toHaveLength(2);
  });

  it("applies custom className", () => {
    const customClass = "custom-indicator-class";
    const { container } = render(<MultiStepIndicator currentStep="upload" className={customClass} />);

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("has proper aria attributes for accessibility", () => {
    render(<MultiStepIndicator currentStep="preview" />);

    // Current step should have aria-current="step"
    const activeStepElements = screen.getAllByLabelText("current step");
    expect(activeStepElements).toHaveLength(2); // Mobile and desktop versions
  });

  it("handles all step transitions correctly", () => {
    // Test upload step
    const { rerender } = render(<MultiStepIndicator currentStep="upload" />);
    expect(screen.queryAllByText("✓")).toHaveLength(0); // No completed steps

    // Test preview step
    rerender(<MultiStepIndicator currentStep="preview" />);
    expect(screen.queryAllByText("✓")).toHaveLength(2); // Upload completed (mobile + desktop)

    // Test processing step
    rerender(<MultiStepIndicator currentStep="processing" />);
    expect(screen.queryAllByText("✓")).toHaveLength(4); // Upload + Preview completed

    // Test results step
    rerender(<MultiStepIndicator currentStep="results" />);
    expect(screen.queryAllByText("✓")).toHaveLength(6); // Upload + Preview + Processing completed
  });

  it("has responsive design classes", () => {
    const { container } = render(<MultiStepIndicator currentStep="upload" />);

    // Check for mobile-first responsive classes
    const mobileView = container.querySelector(".flex.flex-col.space-y-3.sm\\:hidden");
    const desktopView = container.querySelector(".hidden.sm\\:flex");

    expect(mobileView).toBeInTheDocument();
    expect(desktopView).toBeInTheDocument();
  });
});
