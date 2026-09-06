import React from 'react';
import { MapPin, Compass, Globe, Sparkles } from 'lucide-react';

export const PlacesView: React.FC = () => {
  const places = [
    {
      city: 'Kyoto, Japan',
      region: 'Kansai Region',
      coords: '35.0116° N, 135.7681° E',
      entries: 14,
      words: '12,480 words',
      tone: 'Contemplative, Quiet Cedar',
      ambiance: 'Rain on temple roof eaves • 432Hz ambient resonance',
      pinned: true,
      color: '#cbe8ef',
      textColor: '#021f24',
    },
    {
      city: 'Rishikesh, India',
      region: 'Garhwal Himalaya',
      coords: '30.0869° N, 78.2676° E',
      entries: 9,
      words: '8,210 words',
      tone: 'Grounded, River Stone Stillness',
      ambiance: 'Glacial breeze over stone • Temple bells dusk interval',
      pinned: true,
      color: '#ccead0',
      textColor: '#062010',
    },
    {
      city: 'Presidio Studio, SF',
      region: 'California, US',
      coords: '37.7989° N, 122.4662° W',
      entries: 28,
      words: '24,190 words',
      tone: 'Architectural, Deliberate Restraint',
      ambiance: 'Pacific fog clearing • Washi drawing table',
      pinned: true,
      color: '#f9b2d7',
      textColor: '#784160',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 pb-6 border-b border-[#efeeeb]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3f0] text-[#504349] text-[10px] font-semibold uppercase tracking-wider mb-3 border border-[#d4c2c9]/40">
          <Compass className="w-3.5 h-3.5 text-[#854c6c]" />
          Geographic Geography of Thought
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1b1c1a] tracking-tight">
          Places &amp; Atmospheric Contexts
        </h2>
        <p className="font-serif italic text-sm text-[#504349] mt-2 max-w-2xl leading-relaxed">
          How atmospheric location, elevation, and quiet topography shape your reflective decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {places.map((place, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs hover:border-[#d4c2c9] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#827379] mb-3">
                <span className="font-mono text-[10px] bg-[#f5f3f0] px-2 py-0.5 rounded-md text-[#504349]">
                  {place.coords}
                </span>
                <div className="p-1.5 rounded-full" style={{ backgroundColor: place.color, color: place.textColor }}>
                  <MapPin className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="font-serif text-xl font-medium text-[#1b1c1a] mb-1">
                {place.city}
              </h3>
              <span className="text-xs text-[#504349] block mb-4 font-medium">{place.region}</span>

              <div className="space-y-2.5 pt-3 border-t border-[#efeeeb] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#827379]">Reflections:</span>
                  <span className="font-semibold text-[#1b1c1a]">{place.entries} entries</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#827379]">Volume:</span>
                  <span className="text-[#504349] font-mono text-[11px]">{place.words}</span>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] text-[#827379] uppercase tracking-wider font-semibold block mb-1">
                    Atmosphere
                  </span>
                  <p className="font-serif italic text-xs text-[#1b1c1a] leading-relaxed">
                    "{place.ambiance}"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#efeeeb] flex items-center justify-between text-[11px]">
              <span className="text-[#4a6550] font-medium">Cadence Synced</span>
              <span className="text-[#827379]">Local time active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
