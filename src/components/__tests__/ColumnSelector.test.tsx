import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColumnMapping } from "../../types";
import { ColumnSelector } from "../ColumnSelector";

describe("ColumnSelector Component", () => {
  const mockHeaders = ["name", "street", "zipCode", "city", "country"];
  const mockOnMappingChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy with IDs", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check main heading has correct ID
      const mainHeading = screen.getByRole("heading", { name: "Address Columns" });
      expect(mainHeading).toHaveAttribute("id", "address-columns-heading");
      expect(mainHeading.tagName).toBe("H3");

      // Check sub-heading hierarchy and ID
      const subHeading = screen.getByRole("heading", { name: "Additional Data" });
      expect(subHeading.tagName).toBe("H4");
      expect(subHeading).toHaveAttribute("id", "additional-data-heading");
    });

    it("should have accessible form labels", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check that all selects have proper labels
      expect(screen.getByLabelText("ZIP Code")).toBeInTheDocument();
      expect(screen.getByLabelText("Street")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();
      expect(screen.getByLabelText("Country")).toBeInTheDocument();
    });

    it("should have accessible checkboxes with descriptions", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check that checkboxes are properly labeled
      mockHeaders.forEach((header) => {
        const checkbox = screen.getByRole("checkbox", { name: new RegExp(header) });
        expect(checkbox).toBeInTheDocument();
      });
    });

    it("should have aria-describedby for disabled checkboxes", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Select a street column first
      const streetSelect = screen.getByLabelText("Street");
      await user.selectOptions(streetSelect, "street");

      // Check that the street checkbox is now disabled and has aria-describedby
      const streetCheckbox = screen.getByRole("checkbox", { name: /street/ });
      expect(streetCheckbox).toBeDisabled();
      expect(streetCheckbox).toHaveAttribute("aria-describedby", "street-disabled");

      // Check for screen reader text
      expect(screen.getByText("(already selected as address column)")).toBeInTheDocument();
    });
  });

  describe("Column Mapping", () => {
    it("should render all address column selects", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      expect(screen.getByLabelText("ZIP Code")).toBeInTheDocument();
      expect(screen.getByLabelText("Street")).toBeInTheDocument();
      expect(screen.getByLabelText("City")).toBeInTheDocument();
    });

    it("should populate selects with headers", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check that each select has all the options
      const zipSelect = screen.getByLabelText("ZIP Code");
      const streetSelect = screen.getByLabelText("Street");
      const citySelect = screen.getByLabelText("City");
      const countrySelect = screen.getByLabelText("Country");

      mockHeaders.forEach((header) => {
        expect(zipSelect).toContainElement(screen.getAllByRole("option", { name: header })[0]);
        expect(streetSelect).toContainElement(screen.getAllByRole("option", { name: header })[1]);
        expect(citySelect).toContainElement(screen.getAllByRole("option", { name: header })[2]);
        expect(countrySelect).toContainElement(screen.getAllByRole("option", { name: header })[3]);
      });
    });

    it("should call onMappingChange when address columns are selected", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const zipSelect = screen.getByLabelText("ZIP Code");
      await user.selectOptions(zipSelect, "zipCode");

      expect(mockOnMappingChange).toHaveBeenCalledWith({
        zipCode: "zipCode",
        street: undefined,
        city: undefined,
        country: undefined,
        metadataColumns: [],
      });
    });

    it("should call onMappingChange when country column is selected", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const countrySelect = screen.getByLabelText("Country");
      await user.selectOptions(countrySelect, "country");

      expect(mockOnMappingChange).toHaveBeenCalledWith({
        zipCode: undefined,
        street: undefined,
        city: undefined,
        country: "country",
        metadataColumns: [],
      });
    });

    it("should use initial mapping values", () => {
      const initialMapping: ColumnMapping = {
        zipCode: "zipCode",
        street: "street",
        city: "city",
        country: "country",
        metadataColumns: ["name"],
      };

      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} initialMapping={initialMapping} />);

      expect(screen.getByDisplayValue("zipCode")).toBeInTheDocument();
      expect(screen.getByDisplayValue("street")).toBeInTheDocument();
      expect(screen.getByDisplayValue("city")).toBeInTheDocument();
      expect(screen.getByDisplayValue("country")).toBeInTheDocument();
    });
  });

  describe("Metadata Columns", () => {
    it("should render metadata checkboxes for all headers", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      mockHeaders.forEach((header) => {
        expect(screen.getByRole("checkbox", { name: new RegExp(header) })).toBeInTheDocument();
      });
    });

    it("should toggle metadata columns", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const nameCheckbox = screen.getByRole("checkbox", { name: /name/ });
      await user.click(nameCheckbox);

      expect(mockOnMappingChange).toHaveBeenCalledWith({
        zipCode: undefined,
        street: undefined,
        city: undefined,
        metadataColumns: ["name"],
      });
    });

    it("should disable checkboxes for selected address columns", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Select street as address column
      const streetSelect = screen.getByLabelText("Street");
      await user.selectOptions(streetSelect, "street");

      // Check that street checkbox is disabled
      const streetCheckbox = screen.getByRole("checkbox", { name: /street/ });
      expect(streetCheckbox).toBeDisabled();

      // Check that the label has disabled styling
      const streetLabel = streetCheckbox.closest("label");
      expect(streetLabel).toHaveClass("opacity-50");
    });

    it("should show summary of selected metadata columns", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const nameCheckbox = screen.getByRole("checkbox", { name: /name/ });
      const countryCheckbox = screen.getByRole("checkbox", { name: /country/ });

      await user.click(nameCheckbox);
      await user.click(countryCheckbox);

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/additional column\(s\) selected:/)).toBeInTheDocument();

      // Check that both column names appear in the summary
      expect(screen.getByText(/name, country/)).toBeInTheDocument();
    });

    it("should not show summary when no metadata columns selected", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      expect(screen.queryByText(/additional column\(s\) selected:/)).not.toBeInTheDocument();
    });
  });

  describe("Visual States", () => {
    it("should apply correct styling to selected metadata columns", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const nameCheckbox = screen.getByRole("checkbox", { name: /name/ });
      const nameLabel = nameCheckbox.closest("label");

      // Initially unselected
      expect(nameLabel).toHaveClass("bg-white", "border-gray-300");

      await user.click(nameCheckbox);

      // After selection
      expect(nameLabel).toHaveClass("bg-blue-50", "border-blue-300");
    });

    it("should apply disabled styling to address column checkboxes", async () => {
      const user = userEvent.setup();
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      const streetSelect = screen.getByLabelText("Street");
      await user.selectOptions(streetSelect, "street");

      const streetCheckbox = screen.getByRole("checkbox", { name: /street/ });
      const streetLabel = streetCheckbox.closest("label");

      expect(streetLabel).toHaveClass("bg-gray-100", "border-gray-300", "cursor-not-allowed", "opacity-50");
    });
  });

  describe("Semantic Structure", () => {
    it("should have proper semantic structure with correct heading hierarchy", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check heading hierarchy is correct
      const h3Heading = screen.getByRole("heading", { name: "Address Columns" });
      expect(h3Heading.tagName).toBe("H3");
      expect(h3Heading).toHaveAttribute("id", "address-columns-heading");

      const h4Heading = screen.getByRole("heading", { name: "Additional Data" });
      expect(h4Heading.tagName).toBe("H4");
    });

    it("should provide clear instructions for users", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      expect(screen.getByText("Select the columns that contain your address data. At least one column must be selected.")).toBeInTheDocument();
      expect(screen.getByText("Select additional columns to include in the output file.")).toBeInTheDocument();
    });

    it("should use proper form structure with labels and IDs", () => {
      render(<ColumnSelector headers={mockHeaders} onMappingChange={mockOnMappingChange} />);

      // Check that selects have proper IDs matching their labels
      expect(screen.getByLabelText("ZIP Code")).toHaveAttribute("id", "zipcode-select");
      expect(screen.getByLabelText("Street")).toHaveAttribute("id", "street-select");
      expect(screen.getByLabelText("City")).toHaveAttribute("id", "city-select");
    });
  });
});
