import { useState, useCallback } from 'react';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
import { MapComponent } from '@/components/MapComponent';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { SearchBar } from '@/components/SearchBar';
import { CollaboratorPresence } from '@/components/CollaboratorPresence';
import type { DrawingTool, Layer, Feature } from '@/types/app';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Main App component - MapForge UI
 */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'base-layer',
      name: 'Base Map',
      type: 'raster',
      visible: true,
      locked: true,
      color: '#64748b',
    },
  ]);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
  }, []);

  const handleFeatureSelect = useCallback((feature: Feature | null) => {
    setSelectedFeature(feature);
    setPropertiesPanelOpen(feature !== null);
  }, []);

  const handleLayerToggle = useCallback((layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `New Layer ${layers.length}`,
      type: 'vector',
      visible: true,
      locked: false,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    setLayers(prev => [...prev, newLayer]);
  }, [layers.length]);

  const handleMapReady = useCallback((map: MapLibreMap | null) => {
    setMapInstance(map);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          layers={layers}
          onLayerToggle={handleLayerToggle}
          onAddLayer={handleAddLayer}
          mapInstance={mapInstance}
        />

        {/* Map Container */}
        <main className="flex-1 relative">
          {/* Search Bar - Floating */}
          <SearchBar />

          {/* Collaborator Presence - Floating */}
          <CollaboratorPresence />

          {/* Drawing Toolbar - Floating */}
          <Toolbar activeTool={activeTool} onToolChange={handleToolChange} />

          {/* Map */}
          <MapErrorBoundary>
            <MapComponent
              activeTool={activeTool}
              layers={layers}
              onFeatureSelect={handleFeatureSelect}
              onMapReady={handleMapReady}
            />
          </MapErrorBoundary>

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-6 left-4 z-10 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/50">
            <span className="text-xs font-mono text-slate-400">Zoom: 10.0</span>
          </div>
        </main>

        {/* Right Properties Panel */}
        <PropertiesPanel
          isOpen={propertiesPanelOpen}
          feature={selectedFeature}
          onClose={() => setPropertiesPanelOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
