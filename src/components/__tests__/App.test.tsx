import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

// Create simple integration test without heavy mocking
describe("App Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should render the upload step initially", () => {
      render(<App />);

      expect(screen.getByText("addressli")).toBeInTheDocument();
      expect(screen.getByText("Transform your CSV address data into map-ready coordinates (GeoJSON).")).toBeInTheDocument();
      expect(screen.getByText("Upload CSV file")).toBeInTheDocument();
    });

    it("should display progress steps", () => {
      render(<App />);

      expect(screen.getAllByText("Upload")).toHaveLength(2); // Mobile + Desktop
      expect(screen.getAllByText("Preview & Map")).toHaveLength(2);
      expect(screen.getAllByText("Processing")).toHaveLength(2);
      expect(screen.getAllByText("Results")).toHaveLength(2);
    });

    it("should show the active step correctly", () => {
      render(<App />);

      // The first step should be active - both mobile and desktop versions
      const uploadElements = screen.getAllByText("Upload");
      uploadElements.forEach((element) => {
        expect(element).toHaveClass("text-blue-600", "font-medium");
      });
    });
  });

  describe("Navigation", () => {
    it("should show correct step indicators", () => {
      render(<App />);

      // Check that step 1 is active - both mobile and desktop versions
      const stepNumbers = screen.getAllByText("1");
      expect(stepNumbers).toHaveLength(2); // Mobile + Desktop
      stepNumbers.forEach((element) => {
        expect(element).toHaveClass("bg-blue-600");
      });

      // Check that other steps are inactive - both mobile and desktop versions
      const step2Elements = screen.getAllByText("2");
      expect(step2Elements).toHaveLength(2);
      step2Elements.forEach((element) => {
        expect(element).toHaveClass("bg-gray-300");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      render(<App />);

      // The app should render without crashing
      expect(screen.getByText("addressli")).toBeInTheDocument();
    });

    it("should show footer with attribution", () => {
      render(<App />);

      expect(screen.getByText(/addressli uses OpenStreetMap Nominatim/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Nominatim Usage Policy/ })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("type", "file");
    });

    it("should have proper heading hierarchy", () => {
      render(<App />);

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("addressli");
    });
  });

  describe("File Input", () => {
    it("should accept CSV files", () => {
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      expect(fileInput).toHaveAttribute("accept", ".csv,.txt");
    });

    it("should be properly configured", () => {
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      expect(fileInput).toHaveAttribute("type", "file");
      expect(fileInput).toHaveClass("absolute", "inset-0", "w-full", "h-full", "opacity-0", "cursor-pointer");
    });
  });
});
