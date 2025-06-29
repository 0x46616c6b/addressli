import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CSVRow } from "../../types";
import { DataPreview } from "../DataPreview";

describe("DataPreview Component", () => {
  const mockData: CSVRow[] = [
    { name: "John Doe", street: "Musterstraße 1", zipCode: "12345", city: "Berlin" },
    { name: "Jane Smith", street: "Hauptstraße 2", zipCode: "67890", city: "Munich" },
    { name: "Bob Johnson", street: "Nebenstraße 3", zipCode: "54321", city: "Hamburg" },
  ];

  const mockHeaders = ["name", "street", "zipCode", "city"];

  it("should render data preview table with headers", () => {
    render(<DataPreview data={mockData} headers={mockHeaders} />);

    expect(screen.getByRole("heading", { name: "Data Preview" })).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 rows")).toBeInTheDocument();

    // Check headers
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("street")).toBeInTheDocument();
    expect(screen.getByText("zipCode")).toBeInTheDocument();
    expect(screen.getByText("city")).toBeInTheDocument();
  });

  it("should render data rows", () => {
    render(<DataPreview data={mockData} headers={mockHeaders} />);

    // Check first row data
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Musterstraße 1")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Berlin")).toBeInTheDocument();

    // Check second row data
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Munich")).toBeInTheDocument();
  });

  it("should limit displayed rows to maxRows", () => {
    const largeData: CSVRow[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Person ${i + 1}`,
      city: `City ${i + 1}`,
    }));

    render(<DataPreview data={largeData} headers={["name", "city"]} maxRows={3} />);

    expect(screen.getByText("Showing 3 of 10 rows")).toBeInTheDocument();
    expect(screen.getByText(/7.*more rows available/)).toBeInTheDocument();
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getByText("Person 3")).toBeInTheDocument();
    expect(screen.queryByText("Person 4")).not.toBeInTheDocument();
  });

  it("should handle missing data values", () => {
    const dataWithMissing: CSVRow[] = [
      { name: "John", street: "", city: "Berlin" },
      { name: "", street: "Main St", city: "" },
    ];

    render(<DataPreview data={dataWithMissing} headers={["name", "street", "city"]} />);

    // Missing values should show as dash
    const dashElements = screen.getAllByText("-");
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it("should show message when no data is available", () => {
    render(<DataPreview data={[]} headers={[]} />);

    expect(screen.getByText("No data available to display")).toBeInTheDocument();
  });

  it("should show message when headers are empty", () => {
    render(<DataPreview data={mockData} headers={[]} />);

    expect(screen.getByText("No data available to display")).toBeInTheDocument();
  });

  it("should use default maxRows of 5", () => {
    const largeData: CSVRow[] = Array.from({ length: 8 }, (_, i) => ({
      name: `Person ${i + 1}`,
    }));

    render(<DataPreview data={largeData} headers={["name"]} />);

    expect(screen.getByText("Showing 5 of 8 rows")).toBeInTheDocument();
    expect(screen.getByText(/3.*more rows available/)).toBeInTheDocument();
  });

  it("should have proper table structure", () => {
    render(<DataPreview data={mockData} headers={mockHeaders} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Check for table headers
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders).toHaveLength(4);

    // Check for table rows (excluding header row)
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4); // 1 header + 3 data rows
  });
});
