import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});
