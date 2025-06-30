import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

// Mock the usePageProtection hook
vi.mock("../../hooks", () => ({
  usePageProtection: vi.fn(),
}));

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

  describe("Preview Step Accessibility", () => {
    const mockCSVFile = new File(["name,street,zipCode,city\nJohn,Main St,12345,NYC"], "test.csv", { type: "text/csv" });

    it("should have proper ARIA structure when in preview step", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Upload a file to get to preview step
      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFile);

      // Wait for preview step to render
      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Check main heading
      const mainHeading = screen.getByRole("heading", { name: "Preview & Map Columns" });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading.tagName).toBe("H2");

      // Check sections have proper ARIA labeling - specifically look for the two preview sections
      const dataPreviewSection = screen.getByLabelText("Data Preview");
      expect(dataPreviewSection).toHaveAttribute("aria-labelledby", "data-preview-heading");

      const addressColumnsSection = screen.getByLabelText("Address Columns");
      expect(addressColumnsSection).toHaveAttribute("aria-labelledby", "address-columns-heading");
    });

    it("should have accessible heading hierarchy in preview step", async () => {
      const user = userEvent.setup();
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFile);

      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Check heading levels are correct
      const h2Heading = screen.getByRole("heading", { name: "Preview & Map Columns" });
      expect(h2Heading.tagName).toBe("H2");

      const h3Headings = screen.getAllByRole("heading", { level: 3 });
      expect(h3Headings).toHaveLength(2);
      expect(h3Headings[0]).toHaveTextContent("Data Preview");
      expect(h3Headings[1]).toHaveTextContent("Address Columns");

      const h4Heading = screen.getByRole("heading", { name: "Additional Data" });
      expect(h4Heading.tagName).toBe("H4");
    });

    it("should have proper IDs on section headings", async () => {
      const user = userEvent.setup();
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFile);

      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Check IDs are set correctly
      const dataPreviewHeading = screen.getByRole("heading", { name: "Data Preview" });
      expect(dataPreviewHeading).toHaveAttribute("id", "data-preview-heading");

      const addressColumnsHeading = screen.getByRole("heading", { name: "Address Columns" });
      expect(addressColumnsHeading).toHaveAttribute("id", "address-columns-heading");
    });

    it("should maintain semantic structure with sections", async () => {
      const user = userEvent.setup();
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFile);

      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Verify sections exist and are properly structured
      const allSections = document.querySelectorAll("section");
      expect(allSections.length).toBeGreaterThanOrEqual(2);

      // Check that sections contain their respective content
      const dataPreviewSection = document.querySelector('section[aria-labelledby="data-preview-heading"]');
      expect(dataPreviewSection).toBeInTheDocument();
      expect(dataPreviewSection).toContainElement(screen.getByRole("table"));

      const addressColumnsSection = document.querySelector('section[aria-labelledby="address-columns-heading"]');
      expect(addressColumnsSection).toBeInTheDocument();
      expect(addressColumnsSection).toContainElement(screen.getByLabelText("ZIP Code"));
    });

    it("should have accessible form controls in preview step", async () => {
      const user = userEvent.setup();
      render(<App />);

      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFile);

      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Check form labels are accessible
      expect(screen.getByLabelText("ZIP Code")).toBeInTheDocument();
      expect(screen.getByLabelText("Street")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();

      // Check action button is accessible
      const startButton = screen.getByRole("button", { name: "Start Geocoding" });
      expect(startButton).toBeInTheDocument();
      // Button should be enabled because auto-detection will select columns for our test CSV
      expect(startButton).toBeEnabled();
    });

    it("should disable Start Geocoding button when no address columns are mapped", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Use a CSV with headers that won't trigger auto-detection
      const mockCSVFileNoAutoDetect = new File(["column1,column2,column3\nvalue1,value2,value3"], "test.csv", { type: "text/csv" });

      const fileInput = screen.getByLabelText("Select CSV file");
      await user.upload(fileInput, mockCSVFileNoAutoDetect);

      await screen.findByRole("heading", { name: "Preview & Map Columns" });

      // Check action button is disabled when no columns are mapped
      const startButton = screen.getByRole("button", { name: "Start Geocoding" });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toBeDisabled();
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
