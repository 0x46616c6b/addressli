import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "../AppHeader";

describe("AppHeader", () => {
  it("renders with default title and subtitle", () => {
    render(<AppHeader />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("addressli");
    expect(screen.getByText(/Transform your CSV address data into map-ready coordinates/)).toBeInTheDocument();
  });

  it("renders with custom title and subtitle", () => {
    const customTitle = "Custom App";
    const customSubtitle = "Custom description text";

    render(<AppHeader title={customTitle} subtitle={customSubtitle} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`🗺️${customTitle}`);
    expect(screen.getByText(customSubtitle)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const customClass = "custom-header-class";
    const { container } = render(<AppHeader className={customClass} />);

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("has proper semantic structure", () => {
    render(<AppHeader />);

    const header = screen.getByRole("banner");
    const heading = screen.getByRole("heading", { level: 1 });

    expect(header).toBeInTheDocument();
    expect(header).toContainElement(heading);
  });

  it("has responsive text sizing classes", () => {
    render(<AppHeader />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-3xl", "sm:text-4xl", "lg:text-5xl");
  });
});
