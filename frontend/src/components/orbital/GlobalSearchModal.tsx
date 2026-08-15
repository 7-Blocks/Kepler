import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useUIStore, useGlobalSearchOpen } from '@/store';
import { orbitalDataService } from '@/services/orbitalDataService';
import type { OrbitalObject } from '@/types/orbital';
import { OrbitalObjectCard } from './OrbitalObjectCard';
import { OrbitalObjectDetails } from './OrbitalObjectDetails';

export const GlobalSearchModal: React.FC = () => {
  const isOpen = useGlobalSearchOpen();
  const setGlobalSearchOpen = useUIStore((s) => s.setGlobalSearchOpen);
  const setSelectedSatelliteId = useUIStore((s) => s.setSelectedSatelliteId);

  const [query, setQuery] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<OrbitalObject | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setQuery('');
    setGlobalSearchOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return orbitalDataService.searchOrbitalObjects(query, 30);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-bg-deep-space border border-border-panel shadow-[0_0_50px_rgba(0,229,255,0.2)] rounded-lg w-full max-w-2xl flex flex-col overflow-hidden text-on-surface">
        {/* Search Input Header */}
        <div className="p-4 border-b border-border-panel flex items-center gap-3 bg-surface-container/60">
          <MaterialIcon name="search" className="text-primary-container text-xl" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 60,000+ objects by NORAD ID, Name, Operator (e.g. 15544, STARLINK, COSMOS)..."
            className="flex-1 bg-transparent border-none outline-none font-technical-data text-sm text-on-surface placeholder:text-on-surface-variant/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-on-surface-variant hover:text-on-surface p-1"
            >
              <MaterialIcon name="close" className="text-sm" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-2 py-1 border border-border-panel/80 rounded text-[10px] font-label-caps text-on-surface-variant hover:text-on-surface"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
          {!query.trim() ? (
            <div className="py-8 text-center text-on-surface-variant/60 font-technical-data text-xs">
              <MaterialIcon name="satellite_alt" className="text-3xl text-primary-container/30 mb-2 block mx-auto" />
              Type a name, NORAD catalog ID, or country to search the global catalog.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant font-technical-data text-xs">
              No matching orbital objects found for &ldquo;<span className="text-primary">{query}</span>&rdquo;.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-technical-data text-on-surface-variant pb-1">
                <span>FOUND {searchResults.length} RESULTS</span>
                <span>PRESS ESC TO CLOSE</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.map((obj) => (
                  <OrbitalObjectCard
                    key={obj.noradId}
                    object={obj}
                    onSelect={() => {
                      setSelectedSatelliteId(obj.noradId);
                      setSelectedDetails(obj);
                    }}
                    onFlyTo={(noradId) => {
                      setSelectedSatelliteId(noradId);
                      handleClose();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Footer */}
        <div className="p-3 border-t border-border-panel/40 flex justify-between items-center text-[10px] text-on-surface-variant/60 font-technical-data bg-surface-container/30">
          <span>Kepler Unified Orbital Search (64,103 objects indexed)</span>
          <span>Indexed via CelesTrak / Space-Track GP</span>
        </div>
      </div>

      <OrbitalObjectDetails
        object={selectedDetails}
        isOpen={Boolean(selectedDetails)}
        onClose={() => setSelectedDetails(null)}
        onFlyTo={(noradId) => {
          setSelectedSatelliteId(noradId);
          setSelectedDetails(null);
          handleClose();
        }}
      />
    </div>
  );
};
