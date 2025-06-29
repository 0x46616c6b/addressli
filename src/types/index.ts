export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  zipCode?: string;
  street?: string;
  city?: string;
  metadataColumns: string[];
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name?: string;
  address?: {
    postcode?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

export interface ProcessedAddress {
  originalData: CSVRow;
  geocodeResult?: GeocodeResult;
  error?: string;
  coordinates?: [number, number]; // [lat, lon] for Leaflet
}

export interface LeafletFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat] for GeoJSON
  };
  properties: Record<string, string | number | boolean | null>;
}

export interface LeafletFeatureCollection {
  type: "FeatureCollection";
  features: LeafletFeature[];
}

export interface ProcessingProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}
