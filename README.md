# addressli

[![Integration](https://github.com/0x46616c6b/addressli/actions/workflows/integration.yml/badge.svg)](https://github.com/0x46616c6b/addressli/actions/workflows/integration.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=0x46616c6b_addressli&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=0x46616c6b_addressli) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=0x46616c6b_addressli&metric=coverage)](https://sonarcloud.io/summary/new_code?id=0x46616c6b_addressli) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=0x46616c6b_addressli&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=0x46616c6b_addressli)

A modern web application for geocoding CSV address data. Upload a CSV file with addresses, map the columns, and download GeoJSON ready for mapping.

## Features

- 📁 **CSV Upload** - Drag & drop or file picker
- ️ **Column Mapping** - ZIP, street, city, and country columns
- 🤖 **Auto-Detection** - Automatically finds address columns
- 🌍 **Geocoding** - Uses OpenStreetMap Nominatim (free, no API key)
- 📄 **GeoJSON Export** - Ready for Leaflet and other mapping libraries
- ♿ **Accessible** - Full keyboard navigation and screen reader support

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, upload a CSV with address data, and start geocoding!

## CSV Format

Your CSV needs column headers and at least one address component (ZIP, street, city, or country).

Example:

```csv
Name,Street,City,ZIP,Country
John Doe,Musterstraße 1,Berlin,12345,Germany
Jane Smith,Main St 123,New York,10001,USA
```

## Output

Generates GeoJSON format:

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [13.405, 52.52] },
    "properties": { 
      "name": "John Doe",
      "description": "<strong>Email:</strong> john@example.com<br><strong>Address:</strong> Musterstraße 1, 12345 Berlin, Germany",
      "Email": "john@example.com"
    }
  }]
}
```

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- OpenStreetMap Nominatim

## Notes

- Runs entirely in your browser
- Rate limited to 1 request/second (Nominatim policy)
- Large files take time due to rate limiting
- Including country improves geocoding accuracy

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## License

GNU GPLv3
