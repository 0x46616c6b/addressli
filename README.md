# addressli

A modern web application for geocoding CSV address data for use in mapping projects.

## Overview

addressli allows users to upload CSV files containing address data, preview the data, map address columns, and geocode them. The result is a JSON file in GeoJSON format that can be used directly in mapping libraries such as Leaflet.

## Features

- 📁 **CSV File Upload** - Easy drag & drop or file selection
- 👀 **Data Preview** - Clear table view of CSV data
- 🗺️ **Column Mapping** - Intuitive mapping of zip code, street, and city
- 📊 **Metadata Selection** - Optional additional columns for output
- 🌍 **Geocoding** - Automatic coordinate determination via OpenStreetMap Nominatim
- 📈 **Progress Indicator** - Live updates during processing
- 📄 **GeoJSON Export** - Leaflet-compatible JSON output
- ♿ **Accessibility** - Full keyboard navigation and screen reader support

## Technology Stack

- **React 19** with TypeScript
- **Vite** for rapid development and builds
- **TailwindCSS** for Modern styling
- **Vitest** for unit tests
- **Papa Parse** for CSV processing
- **OpenStreetMap Nominatim** for geocoding

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Open test UI
npm run test:ui

# Build for production
npm run build

# Production preview
npm run preview
```

## Usage

1. **Upload CSV file**: Drag a CSV file into the upload area or click to select it.
2. **Validate data**: Check the data preview.
3. **Assign columns**: Select the columns for zip code, street, and city.
4. **Select metadata**: Optionally select additional columns for the output.
5. **Start geocoding**: Automatically process addresses.
6. **Download results**: JSON file with geocoded data

## CSV format

The CSV file should contain column headings. At least one of the following address components is required:

- Postal Code (ZIP)
- Street with House Number
- City/Town

Example:

```csv
Name, Street, ZIP, City, Email
John Doe, Musterstraße 1, 12345, Berlin, john@example.com
Jane Smith, Hauptstraße 2, 67890, Munich, jane@example.com
```

## Output Format

The generated JSON file uses the GeoJSON format:

```json
{
"type": "FeatureCollection",
"features": [
{
"type": "Feature",
"geometry": {
"type": "Point",
"coordinates": [13.405, 52.52]
},
"properties": {
"Name": "John Doe",
"Email": "john@example.com",
"display_name": "Musterstraße 1, 12345 Berlin, Germany",
"geocode_success": true
}
}
]
}
```

## Development

### Project Structure

```text
src/
├── components/ # React Components
│ ├── FileUpload.tsx
│ ├── DataPreview.tsx
│ ├── ColumnSelector.tsx
│ ├── ProcessingProgress.tsx
│ └── Results.tsx
├── utils/ # Utility Functions
│ ├── csvParser.ts
│ ├── geocoding.ts
│ └── jsonExport.ts
├── types/ # TypeScript types
│ └── index.ts
└── test/ # Test setup
└── setup.ts
```

### Code standards

- TypeScript strict mode enabled
- ESLint for code quality
- Comprehensive unit tests with Vitest
- Accessibility-first design
- Clean code principles

### Running tests

```bash
# All tests
npm run test

# Tests with watch mode
npm run test -- --watch

# Run tests once
npm run test:run

# Test coverage
npm run test:coverage

# Test UI
npm run test:ui
```

### Coverage Reports

The project uses Vitest with V8 coverage provider to generate comprehensive test coverage reports:

- **HTML Report**: Available in `coverage/index.html` after running `npm run test:coverage`
- **LCOV Report**: Generated in `coverage/lcov.info` for SonarCloud integration
- **JSON Report**: Available in `coverage/coverage-final.json`

Coverage is configured to exclude:

- Test files
- Configuration files
- Node modules
- Distribution files

## SonarCloud Integration

This project is integrated with SonarCloud for continuous code quality and security analysis:

- **Quality Gate**: Automated code quality checks
- **Code Coverage**: Test coverage tracking via LCOV reports
- **Security Hotspots**: Security vulnerability detection
- **Maintainability**: Code smell detection and technical debt analysis

The SonarCloud analysis runs automatically on:

- Pull requests to main/develop branches
- Pushes to main/develop branches

Coverage data is automatically uploaded to SonarCloud through the GitHub Actions workflow.

## Accessibility

addressli was developed with comprehensive accessibility in mind:

- Keyboard navigation for all interactive elements
- ARIA labels and semantic HTML
- Screen reader-compatible progress indicators
- High color contrast
- Clear error and success messages

## Rate Limiting

The application respects the Nominatim Usage Policy with:

- 1 second delay between API requests
- User-Agent header for identification
- Error handling for API limits

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## License

GNU GPLv3 - see [LICENSE](LICENSE) for details.

## Contribute

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Notes

- The application runs entirely in the browser - no backend required
- Geocoding is done via OpenStreetMap Nominatim (free, but with rate limits)
- Large CSV files may take longer to process
- The quality of the geocoding results depends on the completeness of the address data
