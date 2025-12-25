import { memo, useState } from 'react';

/**
 * Search bar for geocoding and searching features
 * Floating at top center of map
 */
export const SearchBar = memo(function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
      <div
        className={`relative bg-slate-900/95 backdrop-blur-sm rounded-xl border transition-all shadow-2xl shadow-black/30 ${
          isFocused ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-700/50'
        }`}
      >
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg
            className={`w-5 h-5 transition-colors ${isFocused ? 'text-emerald-400' : 'text-slate-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search places, coordinates, or features..."
          className="w-full bg-transparent py-3 pl-12 pr-24 text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        {/* Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* AI Search */}
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-xs font-medium text-violet-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI
          </button>
        </div>
      </div>

      {/* Search Results Dropdown (mock) */}
      {isFocused && query && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-2xl shadow-black/30 overflow-hidden">
          <div className="p-2">
            <p className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Suggestions</p>
            {['San Francisco, CA', 'San Jose, CA', 'Santa Clara, CA'].map((suggestion, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-sm text-slate-300">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

