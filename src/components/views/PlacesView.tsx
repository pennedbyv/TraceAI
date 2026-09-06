import React, { useEffect, useRef, useState } from 'react';
import type { JournalEntry } from '../../types';
import { MapPin, Compass, ChevronRight } from 'lucide-react';

interface PlacesViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

function useLeaflet(onReady: () => void) {
  useEffect(() => {
    if ((window as any).L) {
      onReady();
      return;
    }
    if (document.getElementById('leaflet-css')) {
      // script already injected, wait for it
      const check = setInterval(() => {
        if ((window as any).L) { clearInterval(check); onReady(); }
      }, 50);
      return () => clearInterval(check);
    }

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = onReady;
    document.head.appendChild(script);
  }, []);
}

function groupByLocation(entries: JournalEntry[]) {
  const map = new Map<string, { location: string; coords: { lat: number; lng: number }; pinType: JournalEntry['pinType']; entries: JournalEntry[] }>();
  for (const e of entries) {
    if (!e.location || !e.coordinates) continue;
    if (!map.has(e.location)) {
      map.set(e.location, { location: e.location, coords: e.coordinates, pinType: e.pinType || 'default', entries: [] });
    }
    map.get(e.location)!.entries.push(e);
  }
  return Array.from(map.values());
}

const PIN_META: Record<string, { emoji: string; color: string }> = {
  default:  { emoji: '📍', color: '#854c6c' },
  home:     { emoji: '🏠', color: '#4a6550' },
  office:   { emoji: '🏢', color: '#486369' },
  love:     { emoji: '❤️', color: '#ba1a1a' },
  cafe:     { emoji: '☕', color: '#7c5c3a' },
  nature:   { emoji: '🌿', color: '#3a7c4a' },
  travel:   { emoji: '✈️', color: '#2c5f8a' },
  favorite: { emoji: '⭐', color: '#b07d00' },
  temple:   { emoji: '🛕', color: '#7c3a7c' },
  memory:   { emoji: '🕯️', color: '#504349' },
};

export const PlacesView: React.FC<PlacesViewProps> = ({ entries, onSelectEntry }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState<{ location: string; entries: JournalEntry[] } | null>(null);
  const [activePinType, setActivePinType] = useState<JournalEntry['pinType'] | 'all'>('all');
  const [leafletReady, setLeafletReady] = useState(!!(window as any).L);

  useLeaflet(() => setLeafletReady(true));

  const groups = groupByLocation(entries);
  const visibleGroups = activePinType === 'all'
    ? groups
    : groups.filter((group) => (group.pinType || 'default') === activePinType);

  useEffect(() => {
    setSelected(null);
  }, [activePinType]);

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapInstanceRef.current = map;

    // Pure OpenStreetMap tiles — completely free, no API key ever needed
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(map);

    map.setView([20.5937, 78.9629], 5); // Default to India

    // Fly to user's GPS on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 11, { duration: 1.5 }),
        () => {}
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletReady]);

  // Re-render markers whenever groups change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletReady) return;

    const L = (window as any).L;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (visibleGroups.length === 0) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }

    const bounds: [number, number][] = [];

    visibleGroups.forEach((g) => {
      bounds.push([g.coords.lat, g.coords.lng]);

      const meta = PIN_META[g.pinType || 'default'] || PIN_META.default;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${meta.color};color:white;border-radius:50%;
          width:42px;height:42px;display:flex;flex-direction:column;align-items:center;
          justify-content:center;font-size:18px;line-height:1;
          box-shadow:0 3px 10px rgba(0,0,0,0.25);
          border:2.5px solid white;cursor:pointer;
        ">
          <span style="font-size:18px;line-height:1">${meta.emoji}</span>
          ${g.entries.length > 1 ? `<span style="font-size:9px;font-weight:700;font-family:sans-serif;margin-top:1px">${g.entries.length}</span>` : ''}
        </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([g.coords.lat, g.coords.lng], { icon }).addTo(map);
      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;"><b>${g.location}</b><br/>${g.entries.length} entr${g.entries.length === 1 ? 'y' : 'ies'}</div>`,
        { direction: 'top', offset: [0, -22], opacity: 0.95 }
      );
      marker.on('click', () => setSelected({ location: g.location, entries: g.entries }));
      markersRef.current.push(marker);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 11);
    } else {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [leafletReady, activePinType, JSON.stringify(visibleGroups.map((g) => ({ l: g.location, n: g.entries.length })))]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f4] relative" style={{ zIndex: 0, isolation: 'isolate' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3f0] text-[#504349] text-[10px] font-semibold uppercase tracking-wider mb-3 border border-[#d4c2c9]/40">
          <Compass className="w-3.5 h-3.5 text-[#854c6c]" />
          Spatial Chronicle • {visibleGroups.length} Location{visibleGroups.length !== 1 ? 's' : ''} Shown
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1b1c1a] tracking-tight">
          Places &amp; Geographic Footprints
        </h2>
        <p className="font-serif italic text-sm text-[#504349] mt-1 max-w-2xl leading-relaxed">
          A contemplative map of where reflections unfolded — tracing the intersection of topography, personal entries, and ambient states.
        </p>
        {/* Pin type legend */}
        <div className="flex flex-wrap gap-2 mt-3" aria-label="Filter map markers">
          <button
            onClick={() => setActivePinType('all')}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${activePinType === 'all' ? 'border-[#854c6c] bg-[#854c6c] text-white' : 'border-[#e8e4e1] bg-white text-[#504349] hover:border-[#d4c2c9]'}`}
            type="button"
            aria-pressed={activePinType === 'all'}
          >
            All markers
          </button>
          {Object.entries(PIN_META).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => setActivePinType(type as JournalEntry['pinType'])}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${activePinType === type ? 'border-[#854c6c] bg-[#854c6c] text-white' : 'border-[#e8e4e1] bg-white text-[#504349] hover:border-[#d4c2c9]'}`}
              type="button"
              aria-pressed={activePinType === type}
            >
              <span>{meta.emoji}</span>
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map + Side panel */}
      <div className="flex flex-1 gap-4 px-8 pb-8 items-start">
        {/* Map container */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-[#e8e4e1] shadow-[0_4px_24px_rgba(43,33,36,0.08)] relative" style={{ minHeight: 540, isolation: 'isolate', zIndex: 0 }}>
          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f5f3f0] z-10">
              <span className="text-xs text-[#827379] font-serif italic animate-pulse">Loading map...</span>
            </div>
          )}

          <div ref={mapRef} style={{ width: '100%', height: 540 }} />

          {leafletReady && groups.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <MapPin className="w-8 h-8 text-[#d4c2c9] mb-3" />
              <p className="text-sm text-[#827379] font-serif italic">No locations pinned yet.</p>
              <p className="text-xs text-[#827379] mt-1 px-8 text-center">
                Open a journal entry and tap <span className="font-semibold">Pin location</span> to add your GPS position.
              </p>
            </div>
          )}
        </div>

        {/* Selected location side panel */}
        {selected && (
          <div className="w-72 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 shrink-0">
            {/* Location card */}
            <div className="p-4 rounded-2xl bg-white border border-[#e8e4e1] shadow-xs">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 text-[#854c6c]" />
                    <span className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold">Selected Coordinate</span>
                  </div>
                  <h3 className="font-serif text-lg text-[#1b1c1a] font-medium leading-tight">
                    {PIN_META[selected.entries[0]?.pinType || 'default']?.emoji} {selected.location}
                  </h3>
                  <p className="text-xs text-[#504349] mt-0.5">{selected.entries.length} entr{selected.entries.length === 1 ? 'y' : 'ies'} anchored</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[#827379] hover:text-[#1b1c1a] text-xl leading-none cursor-pointer shrink-0"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#efeeeb]">
                <div className="bg-[#f5f3f0] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#827379] uppercase tracking-wider block mb-0.5">Entries</span>
                  <span className="text-sm font-semibold text-[#1b1c1a]">{selected.entries.length}</span>
                </div>
                <div className="bg-[#f5f3f0] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#827379] uppercase tracking-wider block mb-0.5">Words</span>
                  <span className="text-sm font-semibold text-[#1b1c1a]">
                    {selected.entries.reduce((s, e) => s + (e.wordCount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Entries list */}
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 380 }}>
              <span className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold px-1">
                Chronological Entries
              </span>
              {selected.entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onSelectEntry(e)}
                  className="w-full text-left p-3.5 rounded-2xl bg-white border border-[#e8e4e1] hover:border-[#d4c2c9] hover:shadow-sm transition-all cursor-pointer group"
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#827379] font-mono block mb-1">
                        {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' '}• {e.wordCount} words
                      </span>
                      <p className="font-serif text-sm font-medium text-[#1b1c1a] truncate">{e.title}</p>
                      {e.content && (
                        <p className="text-xs text-[#504349] mt-1 leading-relaxed line-clamp-2">
                          {e.content.slice(0, 90)}...
                        </p>
                      )}
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
