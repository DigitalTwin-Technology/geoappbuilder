import { useEffect, useRef, useCallback, useMemo } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import type { MapOptions, StyleSpecification } from 'maplibre-gl';
import type { DrawingTool, Layer, Feature } from '@/types/app';

interface MapComponentProps {
  activeTool: DrawingTool;
  layers: Layer[];
  onFeatureSelect: (feature: Feature | null) => void;
  onMapReady?: (map: MapLibreMap | null) => void;
}

/**
 * Default map style - CartoDB Positron (light, clean basemap)
 * Free and reliable OSM-based tiles
 */
const CARTO_POSITRON_STYLE: StyleSpecification = {
  version: 8,
  name: 'CartoDB Positron',
  sources: {
    'carto-positron': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-positron-layer',
      type: 'raster',
      source: 'carto-positron',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

/**
 * Default map configuration
 */
const DEFAULT_MAP_OPTIONS: Partial<MapOptions> = {
  center: [6.9603, 50.9375], // Cologne, Germany
  zoom: 2, // Zoomed out to see tectonic plates
  minZoom: 1,
  maxZoom: 20,
  attributionControl: false,
  trackResize: true,
};

/**
 * Cursor styles for different tools
 */
const TOOL_CURSORS: Record<DrawingTool, string> = {
  select: 'default',
  pan: 'grab',
  point: 'crosshair',
  line: 'crosshair',
  polygon: 'crosshair',
  rectangle: 'crosshair',
  circle: 'crosshair',
  text: 'text',
  measure: 'crosshair',
};

/**
 * MapComponent - Full-screen MapLibre GL map with drawing support
 *
 * Following .cursorrules:
 * - Properly cleans up map instance on unmount (map.remove())
 * - Uses memoized callbacks to prevent unnecessary re-renders
 * - Uses OSM tiles via CartoDB (no Google Maps API)
 */
export function MapComponent({
  activeTool,
  layers: _layers,
  onFeatureSelect,
  onMapReady,
}: MapComponentProps): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // Memoize cursor style
  const cursorStyle = useMemo(() => TOOL_CURSORS[activeTool], [activeTool]);

  /**
   * Memoized map initialization callback
   * Per .cursorrules: components touching Map instance must be memoized
   */
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: CARTO_POSITRON_STYLE,
      ...DEFAULT_MAP_OPTIONS,
    });

    // Add navigation controls (positioned in top-right but offset for UI)
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      'bottom-right'
    );

    // Add scale control
    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric',
      }),
      'bottom-right'
    );

    // Add attribution control (custom position)
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    // Log when map loads for debugging
    map.on('load', () => {
      console.log('[MapComponent] Map loaded successfully');

      // Add demo data source - Cologne landmarks
      map.addSource('demo-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Kölner Dom', category: 'landmark' },
              geometry: { type: 'Point', coordinates: [6.9578, 50.9413] },
            },
            {
              type: 'Feature',
              properties: { name: 'Hohenzollern Bridge', category: 'landmark' },
              geometry: { type: 'Point', coordinates: [6.9658, 50.9412] },
            },
            {
              type: 'Feature',
              properties: { name: 'Chocolate Museum', category: 'attraction' },
              geometry: { type: 'Point', coordinates: [6.9644, 50.9322] },
            },
            {
              type: 'Feature',
              properties: { name: 'Old Town (Altstadt)', category: 'attraction' },
              geometry: { type: 'Point', coordinates: [6.9597, 50.9369] },
            },
            {
              type: 'Feature',
              properties: { name: 'RheinEnergieStadion', category: 'sports' },
              geometry: { type: 'Point', coordinates: [6.8753, 50.9335] },
            },
          ],
        },
      });

      // Add points layer
      map.addLayer({
        id: 'demo-points-layer',
        type: 'circle',
        source: 'demo-points',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'category'],
            'landmark', '#ef4444',
            'attraction', '#3b82f6',
            'sports', '#22c55e',
            '#8b5cf6'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Add Tectonic Plate Boundaries (simplified major plate boundaries)
      map.addSource('tectonic-plates', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // Pacific Ring of Fire (simplified)
            {
              type: 'Feature',
              properties: { name: 'Pacific Ring of Fire - West', type: 'convergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [140, 35], [142, 40], [145, 45], [150, 50], [155, 55],
                  [160, 58], [165, 60], [170, 62], [175, 63], [180, 62],
                  [-175, 60], [-170, 55], [-165, 52], [-160, 55], [-155, 57],
                  [-150, 58], [-145, 58], [-140, 57], [-135, 55], [-130, 50],
                  [-125, 45], [-120, 40], [-115, 35], [-110, 30], [-105, 25],
                  [-100, 20], [-95, 18], [-90, 15], [-85, 10], [-80, 5],
                  [-80, 0], [-82, -5], [-78, -15], [-75, -25], [-73, -35],
                  [-75, -45], [-75, -55]
                ]
              }
            },
            // Pacific Ring of Fire - East Asia
            {
              type: 'Feature',
              properties: { name: 'Pacific Ring of Fire - East Asia', type: 'convergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [140, 35], [135, 30], [130, 25], [125, 20], [120, 15],
                  [118, 10], [120, 5], [125, 0], [130, -5], [135, -10],
                  [140, -15], [145, -20], [150, -25], [155, -30], [165, -35],
                  [170, -40], [175, -45], [180, -45], [-175, -50]
                ]
              }
            },
            // Mid-Atlantic Ridge
            {
              type: 'Feature',
              properties: { name: 'Mid-Atlantic Ridge', type: 'divergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-20, 70], [-18, 65], [-20, 60], [-25, 55], [-30, 50],
                  [-32, 45], [-35, 40], [-38, 35], [-40, 30], [-42, 25],
                  [-44, 20], [-45, 15], [-43, 10], [-40, 5], [-35, 0],
                  [-30, -5], [-25, -10], [-20, -15], [-15, -20], [-10, -25],
                  [-8, -30], [-5, -35], [0, -40], [5, -45], [10, -50],
                  [15, -55], [20, -58]
                ]
              }
            },
            // Himalayan Collision Zone
            {
              type: 'Feature',
              properties: { name: 'Himalayan Collision Zone', type: 'convergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [65, 35], [70, 35], [75, 33], [80, 30], [85, 28],
                  [90, 27], [95, 28], [100, 25], [105, 22]
                ]
              }
            },
            // East African Rift
            {
              type: 'Feature',
              properties: { name: 'East African Rift', type: 'divergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [35, 15], [37, 10], [38, 5], [37, 0], [35, -5],
                  [33, -10], [32, -15], [30, -20], [28, -25]
                ]
              }
            },
            // Mediterranean/Alpine Belt
            {
              type: 'Feature',
              properties: { name: 'Alpine-Mediterranean Belt', type: 'convergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-10, 36], [0, 38], [10, 42], [15, 44], [20, 42],
                  [25, 40], [30, 38], [35, 37], [40, 38], [45, 40],
                  [50, 38], [55, 35], [60, 33], [65, 35]
                ]
              }
            },
            // Iceland Ridge (divergent)
            {
              type: 'Feature',
              properties: { name: 'Iceland Ridge', type: 'divergent' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-25, 63], [-20, 65], [-18, 66], [-15, 66], [-12, 65]
                ]
              }
            }
          ]
        }
      });

      // Add tectonic plates line layer
      map.addLayer({
        id: 'tectonic-plates-layer',
        type: 'line',
        source: 'tectonic-plates',
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'divergent', '#ef4444',    // Red for spreading ridges
            'convergent', '#f97316',   // Orange for subduction zones
            '#8b5cf6'                  // Purple default
          ],
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1]
        }
      });

      // Add click handler for tectonic plates
      map.on('click', 'tectonic-plates-layer', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          new maplibregl.Popup({ closeButton: true, closeOnClick: true })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-slate-900">${feature.properties?.name ?? 'Tectonic Boundary'}</h3>
                <p class="text-sm text-slate-600">Type: ${feature.properties?.type ?? 'unknown'}</p>
              </div>
            `)
            .addTo(map);
        }
      });

      map.on('mouseenter', 'tectonic-plates-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'tectonic-plates-layer', () => {
        map.getCanvas().style.cursor = cursorStyle;
      });

      // Add hover effect
      map.on('mouseenter', 'demo-points-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'demo-points-layer', () => {
        map.getCanvas().style.cursor = cursorStyle;
      });

      // Add click handler for feature selection
      map.on('click', 'demo-points-layer', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const coords = (feature.geometry as GeoJSON.Point).coordinates;
          
          onFeatureSelect({
            id: String(feature.id ?? `point-${Date.now()}`),
            layerId: 'demo-points',
            type: 'Point',
            properties: {
              name: feature.properties?.name as string | undefined,
              description: feature.properties?.description as string | undefined,
              color: '#3b82f6',
              strokeWidth: 2,
              fillOpacity: 0.5,
            },
            coordinates: coords,
          });

          // Show popup
          new maplibregl.Popup({ closeButton: true, closeOnClick: true })
            .setLngLat(coords as [number, number])
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-slate-900">${feature.properties?.name ?? 'Unnamed'}</h3>
                <p class="text-sm text-slate-600">${feature.properties?.category ?? ''}</p>
              </div>
            `)
            .addTo(map);
        }
      });

      // Click on map (not on feature) to deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['demo-points-layer'],
        });
        if (features.length === 0) {
          onFeatureSelect(null);
        }
      });

      // Notify parent that map is ready
      onMapReady?.(map);
    });

    // Handle WebGL context lost
    map.on('webglcontextlost', () => {
      console.error('[MapComponent] WebGL context lost');
    });

    // Handle WebGL context restored
    map.on('webglcontextrestored', () => {
      console.log('[MapComponent] WebGL context restored');
    });

    mapInstanceRef.current = map;
  }, [cursorStyle, onFeatureSelect]);

  /**
   * Update cursor when tool changes
   */
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getCanvas().style.cursor = cursorStyle;
    }
  }, [cursorStyle]);

  /**
   * Initialize map on mount, clean up on unmount
   * Per .cursorrules: map.remove() must be called in useEffect cleanup
   */
  useEffect(() => {
    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        console.log('[MapComponent] Cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        onMapReady?.(null);
      }
    };
  }, [initializeMap]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0"
      aria-label="Interactive map"
      role="application"
    />
  );
}
