export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  zipCode?: string;
  street?: string;
  city?: string;
  country?: string;
  metadataColumns: string[];
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name?: string;
  address?: AddressData;
}

export interface AddressData {
  house_number?: string;
  road?: string;
  quarter?: string;
  suburb?: string;
  city_district?: string;
  municipality?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  county?: string;
  country?: string;
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
