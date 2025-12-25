/**
 * Application-specific TypeScript types
 * Per .cursorrules: Strict TypeScript, no `any` types
 */

export type DrawingTool = 
  | 'select' 
  | 'pan' 
  | 'point' 
  | 'line' 
  | 'polygon' 
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'measure';

export type LayerType = 'vector' | 'raster' | 'geojson' | 'tile';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity?: number;
  color: string;
  featureCount?: number;
}

export interface Feature {
  id: string;
  layerId: string;
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  properties: FeatureProperties;
  coordinates: number[] | number[][] | number[][][];
}

export interface FeatureProperties {
  name?: string;
  description?: string;
  color?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursorPosition?: {
    lng: number;
    lat: number;
  };
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

