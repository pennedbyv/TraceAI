import React, { useState } from 'react';
import type { JournalEntry } from '../../types';

const PIN_TYPES: { type: JournalEntry['pinType']; emoji: string; label: string }[] = [
  { type: 'default',  emoji: '📍', label: 'Default'  },
  { type: 'home',     emoji: '🏠', label: 'Home'     },
  { type: 'office',   emoji: '🏢', label: 'Office'   },
  { type: 'love',     emoji: '❤️', label: 'Love'     },
  { type: 'cafe',     emoji: '☕', label: 'Café'     },
  { type: 'nature',   emoji: '🌿', label: 'Nature'   },
  { type: 'travel',   emoji: '✈️', label: 'Travel'   },
  { type: 'favorite', emoji: '⭐', label: 'Favourite' },
  { type: 'temple',   emoji: '🛕', label: 'Temple'   },
  { type: 'memory',   emoji: '🕯️', label: 'Memory'   },
];

interface Props {
  onCreateEntry: (opts: {
    category: 'work' | 'personal';
    pinLocation: boolean;
    pinType: JournalEntry['pinType'];
  }) => void;
}

export const FirstEntrySetup: React.FC<Props> = ({ onCreateEntry }) => {
  const [category, setCategory] = useState<'work' | 'personal'>('personal');
  const [pinLocation, setPinLocation] = useState(false);
  const [pinType, setPinType] = useState<JournalEntry['pinType']>('default');

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-[#f9b2d7]/30 border border-[#f9b2d7]/60 flex items-center justify-center mx-auto mb-5">
          <span className="font-serif text-2xl text-[#854c6c]">✦</span>
        </div>
        <h2 className="font-serif text-3xl text-[#1b1c1a] tracking-tight mb-2">Begin your first entry</h2>
        <p className="font-serif italic text-sm text-[#827379] leading-relaxed">
          Start with what is on your mind.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Category */}
        <div className="bg-white rounded-2xl border border-[#e8e4e1] p-5">
          <p className="text-[10px] text-[#827379] uppercase tracking-widest font-semibold mb-3">Entry type</p>
          <div className="flex gap-2">
            {(['personal', 'work'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer capitalize ${
                  category === c
                    ? 'bg-[#f9b2d7] text-[#784160]'
                    : 'bg-[#f5f3f0] text-[#504349] hover:bg-[#efeeeb]'
                }`}
                type="button"
              >
                {c === 'personal' ? '🌸 Personal' : '💼 Work'}
              </button>
            ))}
          </div>
        </div>

        {/* Pin location toggle */}
        <div className="bg-white rounded-2xl border border-[#e8e4e1] p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[10px] text-[#827379] uppercase tracking-widest font-semibold mb-0.5">Pin this location</p>
              <p className="text-xs text-[#504349]">Attach your current GPS position to this entry</p>
            </div>
            <button
              onClick={() => setPinLocation((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${pinLocation ? 'bg-[#854c6c]' : 'bg-[#d4c2c9]'}`}
              type="button"
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pinLocation ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Pin type picker — shown when location is toggled on */}
          {pinLocation && (
            <div className="mt-4 pt-4 border-t border-[#efeeeb]">
              <p className="text-[10px] text-[#827379] uppercase tracking-widest font-semibold mb-3">Pin type</p>
              <div className="grid grid-cols-5 gap-2">
                {PIN_TYPES.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => setPinType(p.type)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors cursor-pointer ${
                      pinType === p.type
                        ? 'bg-[#f9b2d7]/40 ring-1 ring-[#854c6c]'
                        : 'hover:bg-[#f5f3f0]'
                    }`}
                    type="button"
                  >
                    <span className="text-xl leading-none">{p.emoji}</span>
                    <span className="text-[9px] text-[#827379] font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date & time — read only, just for context */}
        <div className="bg-white rounded-2xl border border-[#e8e4e1] p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#827379] uppercase tracking-widest font-semibold mb-0.5">Date & time</p>
            <p className="text-sm text-[#1b1c1a] font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-[#827379]">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className="text-2xl">🕰️</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onCreateEntry({ category, pinLocation, pinType })}
          className="w-full py-4 rounded-2xl bg-[#f4a9d1] text-[#784160] text-sm font-semibold hover:bg-[#ffd8ea] transition-colors cursor-pointer shadow-sm mt-2"
          type="button"
        >
          Open Journal →
        </button>
      </div>
    </div>
  );
};
