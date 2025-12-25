import { memo } from 'react';

/**
 * Mock collaborators for demo
 */
const mockCollaborators = [
  { id: '1', name: 'Alice Chen', color: '#f97316', isActive: true },
  { id: '2', name: 'Bob Smith', color: '#8b5cf6', isActive: true },
  { id: '3', name: 'Carol Davis', color: '#ec4899', isActive: false },
];

/**
 * Collaborator presence indicator
 * Shows active users on the map
 */
export const CollaboratorPresence = memo(function CollaboratorPresence() {
  const activeCollaborators = mockCollaborators.filter((c) => c.isActive);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/50 p-2 shadow-2xl shadow-black/30">
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {activeCollaborators.map((collaborator, index) => (
            <div
              key={collaborator.id}
              className="relative"
              style={{ zIndex: activeCollaborators.length - index }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ring-2 ring-slate-900 cursor-pointer hover:ring-white transition-all hover:scale-110 hover:z-50"
                style={{ backgroundColor: collaborator.color }}
                title={collaborator.name}
              >
                {collaborator.name.charAt(0)}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700" />

        {/* Count & Invite */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {activeCollaborators.length} online
          </span>
          <button className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors group">
            <svg
              className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Cursor indicators would be rendered on the map canvas */}
    </div>
  );
});

