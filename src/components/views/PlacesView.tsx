import React, { useEffect, useRef, useState } from 'react';
import type { JournalEntry } from '../../types';
import { MapPin, Compass, ChevronRight } from 'lucide-react';

interface PlacesViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

// Inject Leaflet CSS + JS from CDN once
function useLeaflet(onReady: () => void) {
  useEffect(() => {
    if ((window as any).L) { onReady(); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = onReady;
    document.head.appendChild(script);
  }, []);
}

// Group entries by location name, pick coordinates from first entry that has them
function groupByLocation(entries: JournalEntry[]) {
  const map = new Map<string, { location: string; coords: { lat: number; lng: number } | null; entries: JournalEntry[] }>();
  for (const e of entries) {
    if (!e.location) continue;
    if (!map.has(e.location)) map.set(e.location, { location: e.location, coords: e.coordinates || null, entries: [] });
    const g = map.get(e.location)!;
    if (!g.coords && e.coordinates) g.coords = e.coordinates;
    g.entries.push(e);
  }
  return Array.from(map.values()).filter((g) => g.coords);
}

export const PlacesView: React.FC<PlacesViewProps> = ({ entries, onSelectEntry }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selected, setSelected] = useState<{ location: string; entries: JournalEntry[] } | null>(null);
  const [leafletReady, setLeafletReady] = useState(!!(window as any).L);

  useLeaflet(() => setLeafletReady(true));

  const groups = groupByLocation(entries);
  const totalLocations = groups.length;

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const L = (window as any).L;

    // Fix default icon paths broken by bundlers
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapInstanceRef.current = map;

    // Archival paper-style tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 18,
    }).addTo(map);

    if (groups.length === 0) {
      map.setView([20, 78], 4);
      return;
    }

    const bounds: [number, number][] = [];

    groups.forEach((g) => {
      if (!g.coords) return;
      bounds.push([g.coords.lat, g.coords.lng]);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:#854c6c;color:white;border-radius:50%;
          width:36px;height:36px;display:flex;align-items:center;
          justify-content:center;font-size:12px;font-weight:700;
          box-shadow:0 2px 8px rgba(133,76,108,0.4);
          border:2px solid white;cursor:pointer;
        ">${g.entries.length}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([g.coords.lat, g.coords.lng], { icon }).addTo(map);
      marker.bindTooltip(`<b>${g.location}</b><br/>${g.entries.length} entr${g.entries.length === 1 ? 'y' : 'ies'}`, { direction: 'top', offset: [0, -20] });
      marker.on('click', () => setSelected({ location: g.location, entries: g.entries }));
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [leafletReady, groups.length]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3f0] text-[#504349] text-[10px] font-semibold uppercase tracking-wider mb-3 border border-[#d4c2c9]/40">
          <Compass className="w-3.5 h-3.5 text-[#854c6c]" />
          Spatial Chronicle • {totalLocations} Location{totalLocations !== 1 ? 's' : ''} Recorded
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1b1c1a] tracking-tight">Places & Geographic Footprints</h2>
        <p className="font-serif italic text-sm text-[#504349] mt-1 max-w-2xl leading-relaxed">
          A contemplative map of where reflections unfolded — tracing the intersection of topography, personal entries, and ambient states.
        </p>
      </div>

      {/* Map + Sidebar layout */}
      <div className="flex flex-1 gap-0 px-8 pb-8">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-[#e8e4e1] shadow-[0_4px_24px_rgba(43,33,36,0.08)] relative min-h-[520px]">
          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f5f3f0] z-10">
              <span className="text-xs text-[#827379] font-serif italic animate-pulse">Loading map...</span>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full min-h-[520px]" />

          {/* No locations hint */}
          {leafletReady && groups.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <MapPin className="w-8 h-8 text-[#d4c2c9] mb-3" />
              <p className="text-sm text-[#827379] font-serif italic">No locations pinned yet.</p>
              <p className="text-xs text-[#827379] mt-1">Use the 📍 button in journal entries to add GPS locations.</p>
            </div>
          )}
        </div>

        {/* Selected location panel */}
        {selected && (
          <div className="w-80 ml-4 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2">
            <div className="p-4 rounded-2xl bg-white border border-[#e8e4e1] shadow-xs">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#854c6c]" />
                    <span className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold">Selected Coordinate</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#1b1c1a] font-medium">{selected.location}</h3>
                  <p className="text-xs text-[#504349] mt-0.5">{selected.entries.length} entr{selected.entries.length === 1 ? 'y' : 'ies'} anchored</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#827379] hover:text-[#1b1c1a] text-lg leading-none cursor-pointer">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#efeeeb] text-xs">
                <div className="bg-[#f5f3f0] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#827379] uppercase tracking-wider block mb-0.5">Entries</span>
                  <span className="font-semibold text-[#1b1c1a]">{selected.entries.length}</span>
                </div>
                <div className="bg-[#f5f3f0] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#827379] uppercase tracking-wider block mb-0.5">Words</span>
                  <span className="font-semibold text-[#1b1c1a]">{selected.entries.reduce((s, e) => s + (e.wordCount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Entry list */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px]">
              {selected.entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelectEntry(e)}
                  className="w-full text-left p-4 rounded-2xl bg-white border border-[#e8e4e1] hover:border-[#d4c2c9] shadow-xs transition-all cursor-pointer group"
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#827379] font-mono block mb-1">
                        {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {e.wordCount} words
                      </span>
                      <p className="font-serif text-sm font-medium text-[#1b1c1a] truncate">{e.title}</p>
                      <p className="text-xs text-[#504349] mt-1 line-clamp-2 leading-relaxed">{e.content.slice(0, 80)}...</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#d4c2c9] group-hover:text-[#854c6c] shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
