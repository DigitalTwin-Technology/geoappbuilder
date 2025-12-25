/**
 * Strict TypeScript type definitions for GeoJSON
 * Per .cursorrules: No `any` types. Define Interfaces for all GeoJSON properties.
 */

export type GeoJSONGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection';

export interface Position {
  longitude: number;
  latitude: number;
  altitude?: number;
}

export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number] | [number, number, number];
}

export interface MultiPointGeometry {
  type: 'MultiPoint';
  coordinates: Array<[number, number] | [number, number, number]>;
}

export interface LineStringGeometry {
  type: 'LineString';
  coordinates: Array<[number, number] | [number, number, number]>;
}

export interface MultiLineStringGeometry {
  type: 'MultiLineString';
  coordinates: Array<Array<[number, number] | [number, number, number]>>;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Array<Array<[number, number] | [number, number, number]>>;
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: Array<Array<Array<[number, number] | [number, number, number]>>>;
}

export type Geometry =
  | PointGeometry
  | MultiPointGeometry
  | LineStringGeometry
  | MultiLineStringGeometry
  | PolygonGeometry
  | MultiPolygonGeometry;

export interface GeometryCollection {
  type: 'GeometryCollection';
  geometries: Geometry[];
}

/**
 * Feature properties interface
 * Extend this for specific layer property types
 */
export interface FeatureProperties {
  id?: string | number;
  name?: string;
  description?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Feature<
  G extends Geometry = Geometry,
  P extends FeatureProperties = FeatureProperties
> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
  bbox?: [number, number, number, number];
}

export interface FeatureCollection<
  G extends Geometry = Geometry,
  P extends FeatureProperties = FeatureProperties
> {
  type: 'FeatureCollection';
  features: Feature<G, P>[];
  bbox?: [number, number, number, number];
}

/**
 * Layer style properties for MapLibre
 */
export interface LayerStyle {
  id: string;
  type: 'fill' | 'line' | 'circle' | 'symbol' | 'raster' | 'heatmap';
  source: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
}

