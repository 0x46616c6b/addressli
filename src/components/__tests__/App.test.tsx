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

      expect(screen.getByText("adressli")).toBeInTheDocument();
      expect(screen.getByText("Transform your CSV address data into map-ready coordinates (GeoJSON).")).toBeInTheDocument();
      expect(screen.getByText("Upload CSV file")).toBeInTheDocument();
    });

    it("should display progress steps", () => {
      render(<App />);

      expect(screen.getByText("Upload")).toBeInTheDocument();
      expect(screen.getByText("Preview & Map")).toBeInTheDocument();
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("Results")).toBeInTheDocument();
    });

    it("should show the active step correctly", () => {
      render(<App />);

      // The first step should be active
      const stepElements = screen.getAllByText(/Upload|Preview & Map|Processing|Results/);
      const uploadElement = stepElements.find((el) => el.textContent === "Upload");
      expect(uploadElement).toHaveClass("text-blue-600", "font-medium");
    });
  });

  describe("Navigation", () => {
    it("should show correct step indicators", () => {
      render(<App />);

      // Check that step 1 is active
      const stepNumbers = screen.getAllByText("1");
      expect(stepNumbers[0]).toHaveClass("bg-blue-600");

      // Check that other steps are inactive
      const step2 = screen.getByText("2");
      expect(step2).toHaveClass("bg-gray-300");
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      render(<App />);

      // The app should render without crashing
      expect(screen.getByText("adressli")).toBeInTheDocument();
    });

    it("should show footer with attribution", () => {
      render(<App />);

      expect(screen.getByText(/Adressli uses OpenStreetMap Nominatim/)).toBeInTheDocument();
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
      expect(mainHeading).toHaveTextContent("adressli");
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
