<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for Adressli

A modern React TypeScript application for geocoding CSV address data, built with Vite and designed for non-technical users to create map-ready GeoJSON data.

## 🎯 Project Overview

- **Purpose**: Client-side web application for processing CSV files with address data and performing geocoding
- **Primary Users**: Non-technical users who need to convert address data to coordinates for mapping
- **Core Workflow**: CSV Upload → Preview → Column Mapping → Geocoding → GeoJSON Export
- **Output Format**: GeoJSON FeatureCollection compatible with Leaflet and other mapping libraries
- **Architecture**: Pure client-side application (no backend dependencies)

## 🛠️ Technology Stack

### Core Framework

- **React**: `19.1.0` with TypeScript
- **TypeScript**: `~5.8.3` with strict type checking
- **Vite**: `7.0.0` for development and build tooling

### Styling & UI

- **TailwindCSS**: `4.1.11` for utility-first styling
- **@tailwindcss/forms**: `0.5.10` for enhanced form styling
- **PostCSS**: `8.5.6` with autoprefixer

### Testing & Quality

- **Vitest**: `3.2.4` for unit and integration testing
- **@testing-library/react**: `16.3.0` for component testing
- **@testing-library/user-event**: `14.6.1` for interaction testing
- **@vitest/coverage-v8**: `3.2.4` for test coverage reporting
- **ESLint**: `9.29.0` with TypeScript support

### Data Processing

- **Papa Parse**: `5.5.3` for CSV parsing and validation
- **OpenStreetMap Nominatim**: Browser-based geocoding API (no API key required)

## 📋 Application Features

### Core Functionality

1. **CSV File Upload**: Drag & drop or file picker with validation
2. **Data Preview**: Tabular display with pagination for large datasets
3. **Column Mapping**: Interactive UI for mapping ZIP code, street, and city columns
4. **Metadata Selection**: Optional additional columns for inclusion in output
5. **Geocoding Processing**: Batch processing with real-time progress tracking
6. **GeoJSON Export**: Download processed data in Leaflet-compatible format

### User Experience Features

- Real-time validation and error feedback
- Progress indicators for long-running operations
- Comprehensive accessibility support
- Mobile-responsive design
- Clear step-by-step workflow

## 💻 Development Guidelines

### Code Quality Standards

- **TypeScript First**: Use strict TypeScript without `any` types
- **Clean Code**: Follow SOLID principles and clean architecture
- **Single Responsibility**: Each function should have one clear purpose
- **DRY Principle**: Avoid code duplication through shared utilities
- **Comprehensive Testing**: Unit tests for all components and utilities
- **Accessibility First**: WCAG 2.1 AA compliance for all UI elements

### Performance Guidelines

- **Efficient Loops**: Use incremental counters instead of repeated array operations
- **Batch State Updates**: Minimize re-renders during large dataset processing
- **Memory Management**: Avoid memory leaks in async operations
- **Progressive Loading**: Handle large datasets with pagination or virtualization

### Code Organization

```
src/
├── components/         # Reusable UI components
├── types/             # TypeScript type definitions
├── utils/             # Pure utility functions
├── test/              # Test setup and utilities
└── assets/            # Static assets
```

## ⚡ Performance & Complexity Rules

### Function Design

- **Length Limit**: Keep functions under 30 lines when possible
- **Complexity Threshold**: Refactor functions exceeding 40 lines or having multiple responsibilities
- **Nesting Limit**: Avoid deeply nested conditionals (maximum 3 levels)
- **Async Operations**: Extract long async operations into separate utility functions

### State Management

- **Predictable Updates**: Keep component state updates simple and predictable
- **Batch Updates**: Group related state changes to minimize re-renders
- **Immutable Patterns**: Use immutable update patterns for complex state

### Loop Optimization

- **Incremental Counters**: Use counters instead of repeated array filtering
- **Batch Processing**: Process large datasets in chunks to maintain UI responsiveness
- **Memory Efficiency**: Avoid O(n²) operations in large datasets

### Error Handling

- **Centralized Patterns**: Use consistent error handling patterns
- **User-Friendly Messages**: Provide clear, actionable error messages
- **Graceful Degradation**: Handle failures without breaking the application

### Example: Optimized Batch Processing

```typescript
// ✅ Good: Extracted utilities with incremental counters and batched updates
const processedAddress = await processAddressRow(row, mapping);
if (isProcessedAddressSuccessful(processedAddress)) {
  successfulCount++;
} else {
  failedCount++;
}

// Batch state updates every 10 iterations to reduce re-renders
if ((i + 1) % 10 === 0 || i === data.length - 1) {
  const progress = calculateProgress(total, processed, successfulCount, failedCount);
  setState(prev => ({ ...prev, progress, processedData: [...processedData] }));
}

// ❌ Avoid: Updating state on every iteration
setState(prev => ({ ...prev, progress: calculateProgress(...) })); // Causes excessive re-renders
```

## 🔧 Application Workflow

### Step-by-Step Process

1. **File Upload** (`FileUpload` component)

   - Drag & drop or file picker interface
   - CSV validation and parsing with Papa Parse
   - File format validation and error handling

2. **Data Preview** (`DataPreview` component)

   - Tabular display of CSV data with pagination
   - Auto-detection of potential address columns
   - Data quality validation

3. **Column Mapping** (`ColumnSelector` component)

   - Interactive mapping of ZIP code, street, and city columns
   - Optional metadata column selection
   - Validation of required field mappings

4. **Geocoding Processing** (`ProcessingProgress` component)

   - Batch geocoding using OpenStreetMap Nominatim API
   - Real-time progress tracking with success/failure counts
   - Error handling for invalid addresses

5. **Results & Export** (`Results` component)
   - Display of geocoding results with success statistics
   - GeoJSON file generation and download
   - Option to retry failed addresses

### Core Data Types

```typescript
interface CSVRow {
  [key: string]: string;
}
interface ColumnMapping {
  zipCode?: string;
  street?: string;
  city?: string;
  metadataColumns: string[];
}
interface ProcessedAddress {
  originalData: CSVRow;
  geocodeResult?: GeocodeResult;
  error?: string;
  coordinates?: [number, number];
}
interface LeafletFeatureCollection {
  type: "FeatureCollection";
  features: LeafletFeature[];
}
```

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels, roles, and properties
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Focus Management**: Clear focus indicators and logical tab order
- **Semantic HTML**: Use appropriate HTML elements for content structure

### Specific Implementation Guidelines

- **Form Controls**: Use `<label>` elements and `aria-describedby` for help text
- **Progress Indicators**: Include `aria-live` regions for status updates
- **Error Messages**: Use `role="alert"` for immediate error announcements
- **Tables**: Include proper headers and scope attributes for data tables
- **Buttons**: Clear, descriptive text and appropriate ARIA states

## 🧪 Testing Strategy

### Unit Testing

- **Utility Functions**: Test all pure functions in `src/utils/`
- **Component Logic**: Test component behavior and state management
- **Error Scenarios**: Comprehensive error handling validation
- **Type Safety**: Ensure TypeScript types prevent runtime errors

### Integration Testing

- **File Upload Flow**: End-to-end CSV processing workflow
- **API Mocking**: Mock OpenStreetMap Nominatim API responses
- **User Interactions**: Test complete user journeys
- **Accessibility**: Automated a11y testing with testing-library

### Test Organization

```
src/
├── components/__tests__/    # Component tests
├── utils/__tests__/         # Utility function tests
└── test/setup.ts           # Test configuration
```

### Coverage Requirements

- Minimum 80% code coverage for critical paths
- 100% coverage for utility functions
- All error handling scenarios tested

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Run type checking and build
npm run build

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Generate test coverage report
npm run test:coverage

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 📝 Code Style Guidelines

### Import Organization

```typescript
// 1. React and external libraries
import React, { useState, useCallback } from "react";
import { parseCSV } from "papaparse";

// 2. Internal components
import { FileUpload } from "./components/FileUpload";

// 3. Types
import type { CSVRow, ColumnMapping } from "./types";

// 4. Utilities
import { processAddressRow } from "./utils/addressProcessing";
```

### Component Structure

```typescript
// Props interface first
interface ComponentProps {
  data: CSVRow[];
  onProcess: (result: ProcessedAddress[]) => void;
}

// Component with TypeScript
export function Component({ data, onProcess }: ComponentProps): React.JSX.Element {
  // State hooks first
  const [loading, setLoading] = useState(false);

  // Callbacks second
  const handleProcess = useCallback(() => {
    // Implementation
  }, []);

  // Render
  return <div>{/* JSX */}</div>;
}
```

## 📚 Best Practices Summary

When generating code, prioritize:

1. **User Experience**: Simple, intuitive interfaces for non-technical users
2. **Performance**: Efficient processing of large CSV datasets
3. **Accessibility**: Full keyboard navigation and screen reader support
4. **Type Safety**: Strict TypeScript without `any` types
5. **Testability**: Pure functions and mockable dependencies
6. **Error Handling**: Graceful degradation with clear error messages
7. **Code Quality**: Clean, maintainable, and well-documented code
