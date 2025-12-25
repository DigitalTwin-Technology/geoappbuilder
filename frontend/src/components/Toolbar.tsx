import { memo } from 'react';
import type { DrawingTool } from '@/types/app';

interface ToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
}

interface ToolConfig {
  id: DrawingTool;
  name: string;
  icon: JSX.Element;
  shortcut?: string;
}

const tools: ToolConfig[] = [
  {
    id: 'select',
    name: 'Select',
    shortcut: 'V',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
      />
    ),
  },
  {
    id: 'pan',
    name: 'Pan',
    shortcut: 'H',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
      />
    ),
  },
  {
    id: 'point',
    name: 'Point',
    shortcut: 'P',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    id: 'line',
    name: 'Line',
    shortcut: 'L',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 20h16M4 20l4-4m12 4l-4-4M12 4v12m0-12L8 8m4-4l4 4"
      />
    ),
  },
  {
    id: 'polygon',
    name: 'Polygon',
    shortcut: 'G',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a2 2 0 01-2 2h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H6a2 2 0 01-2-2v-3a1 1 0 00-1-1H2a2 2 0 010-4h1a1 1 0 001-1V8a2 2 0 012-2h3a1 1 0 001-1V4z"
      />
    ),
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    shortcut: 'R',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
      />
    ),
  },
  {
    id: 'circle',
    name: 'Circle',
    shortcut: 'C',
    icon: (
      <circle cx="12" cy="12" r="9" strokeWidth={2} fill="none" />
    ),
  },
  {
    id: 'text',
    name: 'Text',
    shortcut: 'T',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M12 6v14M8 6V4h8v2"
      />
    ),
  },
  {
    id: 'measure',
    name: 'Measure',
    shortcut: 'M',
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
        />
      </>
    ),
  },
];

/**
 * Floating Toolbar with drawing tools
 * Positioned on the left side of the map
 */
export const Toolbar = memo(function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-2 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-1">
          {tools.map((tool, index) => (
            <div key={tool.id}>
              {/* Divider after pan tool */}
              {index === 2 && <div className="my-1 h-px bg-slate-700/50" />}
              {/* Divider before measure tool */}
              {index === 8 && <div className="my-1 h-px bg-slate-700/50" />}
              
              <button
                onClick={() => onToolChange(tool.id)}
                className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  activeTool === tool.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tool.icon}
                </svg>

                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                  {tool.name}
                  {tool.shortcut && (
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">
                      {tool.shortcut}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Color Picker (appears below toolbar) */}
      <div className="mt-2 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/50 p-2 shadow-2xl shadow-black/30">
        <div className="flex gap-1.5">
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'].map(
            (color) => (
              <button
                key={color}
                className="w-5 h-5 rounded-full ring-2 ring-slate-700 hover:ring-white transition-all hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
});

