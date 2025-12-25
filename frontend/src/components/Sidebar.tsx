import { memo, useState } from 'react';
import type { Layer } from '@/types/app';
import type { Map as MapLibreMap } from 'maplibre-gl';

interface SidebarProps {
  isOpen: boolean;
  layers: Layer[];
  onLayerToggle: (layerId: string) => void;
  onAddLayer: () => void;
  mapInstance: MapLibreMap | null;
}

type Tab = 'layers' | 'data' | 'style';

/**
 * Sidebar component with layers, data sources, and styling options
 */
export const Sidebar = memo(function Sidebar({
  isOpen,
  layers,
  onLayerToggle,
  onAddLayer,
  mapInstance,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('layers');

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800">
        {(['layers', 'data', 'style'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'layers' && (
          <LayersPanel
            layers={layers}
            onLayerToggle={onLayerToggle}
            onAddLayer={onAddLayer}
          />
        )}
        {activeTab === 'data' && <DataPanel />}
        {activeTab === 'style' && <StylePanel mapInstance={mapInstance} />}
      </div>
    </aside>
  );
});

/**
 * Layers Panel
 */
function LayersPanel({
  layers,
  onLayerToggle,
  onAddLayer,
}: {
  layers: Layer[];
  onLayerToggle: (layerId: string) => void;
  onAddLayer: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Add Layer Button */}
      <button
        onClick={onAddLayer}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-lg text-sm text-slate-300 hover:text-white transition-colors group"
      >
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Layer
      </button>

      {/* Layers List */}
      <div className="space-y-1">
        {layers.map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            onToggle={() => onLayerToggle(layer.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {layers.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No layers yet</p>
          <p className="text-xs text-slate-600 mt-1">Add a layer to get started</p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Layer Item
 */
function LayerItem({
  layer,
  onToggle,
}: {
  layer: Layer;
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="flex items-center gap-3 p-3 hover:bg-slate-800 transition-colors">
        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-slate-700 rounded transition-colors"
        >
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Color Indicator */}
        <div
          className="w-3 h-3 rounded-full ring-2 ring-slate-700"
          style={{ backgroundColor: layer.color }}
        />

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{layer.name}</p>
          <p className="text-xs text-slate-500">{layer.type}</p>
        </div>

        {/* Visibility Toggle */}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded transition-colors ${
            layer.visible ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-600 hover:bg-slate-700'
          }`}
        >
          {layer.visible ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>

        {/* Lock Indicator */}
        {layer.locked && (
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}

        {/* More Options */}
        <button className="p-1 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Opacity</span>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-8 text-right">100%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Data Panel - Import/Upload data sources
 */
function DataPanel() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">Import Data</h3>
        <p className="text-xs text-slate-500 mb-4">
          Drag & drop files or click to browse
        </p>
        <div className="space-y-2">
          <button className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            Upload GeoJSON
          </button>
          <button className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            Upload KML/KMZ
          </button>
          <button className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
            Connect URL
          </button>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 mb-2">Supported formats:</p>
        <div className="flex flex-wrap gap-1">
          {['GeoJSON', 'KML', 'KMZ', 'CSV', 'Shapefile'].map((format) => (
            <span
              key={format}
              className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-500"
            >
              {format}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Available map layers that can be styled
 */
const STYLEABLE_LAYERS = [
  { id: 'tectonic-plates-layer', name: 'Tectonic Plate Lines', type: 'line' as const },
  { id: 'demo-points-layer', name: 'Demo Points (Cologne)', type: 'circle' as const },
];

interface StylePanelProps {
  mapInstance: MapLibreMap | null;
}

/**
 * Style Panel - Global styling options with AI Style Generator
 */
function StylePanel({ mapInstance }: StylePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedLayer, setSelectedLayer] = useState(STYLEABLE_LAYERS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState<{
    style: Record<string, string | number | number[]>;
    explanation: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  // Get the layer type based on selected layer
  const getLayerType = () => {
    const layer = STYLEABLE_LAYERS.find(l => l.id === selectedLayer);
    return layer?.type ?? 'line';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setAppliedMessage(null);
    
    try {
      const response = await fetch('http://localhost:8000/generate-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          layer_type: getLayerType(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const style = data.style;
      
      setGeneratedStyle({
        style: style,
        explanation: data.explanation,
      });

      // Immediately apply the style to the map
      applyStyleToMap(style);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate style');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyStyleToMap = (style: Record<string, string | number | number[]>) => {
    if (!mapInstance) {
      setError('Map not ready. Please wait and try again.');
      return;
    }

    try {
      // Check if the layer exists
      const layer = mapInstance.getLayer(selectedLayer);
      if (!layer) {
        setError(`Layer "${selectedLayer}" not found on map.`);
        return;
      }

      // Apply each style property to the map
      let appliedCount = 0;
      Object.entries(style).forEach(([property, value]) => {
        try {
          mapInstance.setPaintProperty(selectedLayer, property, value);
          appliedCount++;
        } catch (e) {
          console.warn(`Could not apply ${property}:`, e);
        }
      });

      const layerName = STYLEABLE_LAYERS.find(l => l.id === selectedLayer)?.name ?? selectedLayer;
      setAppliedMessage(`✓ Applied ${appliedCount} style properties to "${layerName}"`);
      
      // Clear message after 3 seconds
      setTimeout(() => setAppliedMessage(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply style to map');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Base Map</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Light', active: true },
            { name: 'Dark', active: false },
            { name: 'Satellite', active: false },
            { name: 'Streets', active: false },
          ].map((style) => (
            <button
              key={style.name}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                style.active
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* AI Style Generator */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Style Generator
          <span className="ml-auto text-[10px] text-violet-400/60 font-normal normal-case">Powered by Gemini</span>
        </h3>

        {/* Layer Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Target Layer</label>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
          >
            {STYLEABLE_LAYERS.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name} ({layer.type})
              </option>
            ))}
          </select>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the style you want... (e.g., 'make it bright blue with thick lines' or 'red dashed lines')"
            className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="absolute bottom-2 right-2 px-3 py-1.5 bg-violet-500 hover:bg-violet-400 disabled:bg-violet-500/50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate & Apply
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {appliedMessage && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-pulse">
            <p className="text-xs text-emerald-400">{appliedMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Style Output */}
        {generatedStyle && (
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-400">Applied Style</span>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(generatedStyle.style, null, 2))}
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-xs text-slate-300 font-mono overflow-x-auto max-h-32">
                {JSON.stringify(generatedStyle.style, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-slate-500 italic">
              {generatedStyle.explanation}
            </p>
            
            {/* Style Preview */}
            <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
              <span className="text-xs text-slate-500">Preview:</span>
              <div 
                className="w-8 h-8 rounded border-2"
                style={{
                  backgroundColor: (generatedStyle.style['fill-color'] ?? generatedStyle.style['circle-color'] ?? 'transparent') as string,
                  opacity: (generatedStyle.style['fill-opacity'] ?? generatedStyle.style['circle-opacity'] ?? generatedStyle.style['line-opacity'] ?? 1) as number,
                  borderColor: (generatedStyle.style['line-color'] ?? generatedStyle.style['fill-outline-color'] ?? generatedStyle.style['circle-stroke-color'] ?? '#4ade80') as string,
                  borderWidth: Math.min((generatedStyle.style['line-width'] ?? generatedStyle.style['circle-stroke-width'] ?? 2) as number, 8),
                  borderStyle: generatedStyle.style['line-dasharray'] ? 'dashed' : 'solid',
                }}
              />
            </div>

            {/* Re-apply Button */}
            <button
              onClick={() => applyStyleToMap(generatedStyle.style)}
              disabled={!mapInstance}
              className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Re-apply to Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

