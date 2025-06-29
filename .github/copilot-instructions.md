<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for Adressli

This is a React TypeScript application built with Vite for processing CSV files containing address data and performing reverse geocoding.

## Project Context

- **Purpose**: Web UI for CSV address data processing with reverse geocoding
- **Target Users**: Non-technical users who need to process CSV files with addresses
- **Output**: JSON files compatible with Leaflet maps
- **Architecture**: Client-side only (no backend required)

## Technical Stack

- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling with @tailwindcss/forms
- Vitest for testing
- Papa Parse for CSV processing
- Browser-based geocoding APIs (Nominatim OSM)

## Code Guidelines

- Follow clean code principles
- Implement comprehensive accessibility (ARIA labels, keyboard navigation, semantic HTML)
- Write unit tests for all components and utilities
- Use TypeScript strictly - no `any` types
- Focus on user experience for non-technical users
- Ensure all operations work client-side
- Avoid code duplication

## Key Features

1. CSV file upload with validation
2. Data preview and column selection UI
3. Address column mapping (ZIP, street, city)
4. Optional metadata column selection
5. Reverse geocoding processing with progress indication
6. JSON export for Leaflet compatibility

## Accessibility Requirements

- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Clear error messages and success indicators
- Progress indicators for long-running operations
- High color contrast ratios
- Semantic HTML structure

## Testing Strategy

- Unit tests for utility functions
- Component testing for UI interactions
- Mock external APIs in tests
- Test accessibility features
- Test error handling scenarios

When generating code, prioritize simplicity, accessibility, and user experience.
