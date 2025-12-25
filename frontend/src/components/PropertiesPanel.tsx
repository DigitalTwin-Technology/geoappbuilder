import { memo } from 'react';
import type { Feature } from '@/types/app';

interface PropertiesPanelProps {
  isOpen: boolean;
  feature: Feature | null;
  onClose: () => void;
}

/**
 * Right-side panel for displaying and editing feature properties
 */
export const PropertiesPanel = memo(function PropertiesPanel({
  isOpen,
  feature,
  onClose,
}: PropertiesPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white">Properties</h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {feature ? (
          <FeatureProperties feature={feature} />
        ) : (
          <EmptyState />
        )}
      </div>
    </aside>
  );
});

function FeatureProperties({ feature }: { feature: Feature }) {
  return (
    <div className="space-y-4">
      {/* Feature Type Badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
          {feature.type}
        </span>
        <span className="text-xs text-slate-500">ID: {feature.id}</span>
      </div>

      {/* Name Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Name</label>
        <input
          type="text"
          defaultValue={feature.properties.name ?? ''}
          placeholder="Untitled feature"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
      </div>

      {/* Description Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
        <textarea
          defaultValue={feature.properties.description ?? ''}
          placeholder="Add a description..."
          rows={3}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
      </div>

      {/* Style Options */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Style</h3>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-slate-700"
              style={{ backgroundColor: feature.properties.color ?? '#3b82f6' }}
            />
            <input
              type="text"
              defaultValue={feature.properties.color ?? '#3b82f6'}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Stroke Width</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              defaultValue={feature.properties.strokeWidth ?? 2}
              className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-8 text-sm text-slate-400 text-right">
              {feature.properties.strokeWidth ?? 2}px
            </span>
          </div>
        </div>

        {/* Fill Opacity */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Fill Opacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue={(feature.properties.fillOpacity ?? 0.5) * 100}
              className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-10 text-sm text-slate-400 text-right">
              {Math.round((feature.properties.fillOpacity ?? 0.5) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Custom Properties */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Custom Properties
          </h3>
          <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(feature.properties)
            .filter(([key]) => !['name', 'description', 'color', 'strokeWidth', 'fillOpacity'].includes(key))
            .map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={key}
                  className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <input
                  type="text"
                  defaultValue={String(value ?? '')}
                  className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-800 flex gap-2">
        <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
          Duplicate
        </button>
        <button className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-slate-300 mb-1">No Selection</h3>
      <p className="text-xs text-slate-500">
        Click on a feature to view<br />and edit its properties
      </p>
    </div>
  );
}

