import React from 'react';
import type { JournalEntry } from '../../types';
import { Sparkles, History, Calendar, ArrowUpRight, Download, Quote } from 'lucide-react';

interface MemoriesViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ onSelectEntry }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-8 pb-6 border-b border-[#efeeeb]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cbe8ef] text-[#021f24] text-[10px] font-semibold uppercase tracking-wider mb-3 border border-[#cbe8ef]">
          <History className="w-3.5 h-3.5 text-[#486369]" />
          Temporal Flashback
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1b1c1a] tracking-tight">
          Monthly Archive &amp; Synthesis
        </h2>
        <p className="font-serif italic text-sm text-[#504349] mt-2 max-w-2xl leading-relaxed">
          A contemplative mosaic drawn from private entries, recurring cadences, and quiet decisions across your creative workspace.
        </p>
      </div>

      {/* Core Synthesis Leaf */}
      <div className="p-8 rounded-2xl bg-white border border-[#eae8e5] shadow-xs mb-8">
        <div className="flex items-center gap-2 text-xs text-[#854c6c] font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Gemini Monthly Synthesis</span>
        </div>
        <h3 className="font-serif text-2xl text-[#1b1c1a] font-normal mb-3">
          Theme: Intentional Constraints as Anchor
        </h3>
        <p className="font-serif text-sm text-[#504349] leading-relaxed italic mb-5">
          Across 18 entries logged over the last 30 days, your writing continuously returns to the premise that velocity without tactile stillness is merely cognitive exhaustion. The most decisive breakthroughs occurred during morning sessions without browser tabs.
        </p>
        <div className="p-4 rounded-xl bg-[#f5f3f0] border-l-3 border-[#854c6c] text-xs text-[#1b1c1a] font-serif italic relative">
          <Quote className="w-4 h-4 text-[#854c6c]/40 absolute top-3 right-3" />
          “Restraint is not the absence of energy; it is the compression of intent into pure spatial clarity.”
        </div>
      </div>

      {/* On This Day: Flashback 1 Year Ago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs hover:border-[#d4c2c9] transition-all">
          <div className="flex items-center justify-between text-xs text-[#827379] mb-3">
            <span className="font-serif italic text-[#854c6c] font-semibold">1 Year Ago • Oct 24, 2023</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3f0] text-[10px] text-[#504349] font-medium">Work / Studio</span>
          </div>
          <h4 className="font-serif text-lg font-medium text-[#1b1c1a] mb-2">
            The Hayes Valley Studio Dilemma
          </h4>
          <p className="font-serif text-xs text-[#504349] leading-relaxed line-clamp-3 mb-4 italic">
            Debated whether to take on the larger commercial loft. Ultimately realized that a smaller room with north-facing natural window light forces clarity of thought.
          </p>
          <div className="text-[11px] text-[#4a6550] font-medium bg-[#ccead0]/30 p-2.5 rounded-xl border border-[#ccead0]/60">
            Decision Preserved: Physical boundaries protect mental bandwidth.
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs hover:border-[#d4c2c9] transition-all">
          <div className="flex items-center justify-between text-xs text-[#827379] mb-3">
            <span className="font-serif italic text-[#486369] font-semibold">3 Years Ago • Oct 24, 2021</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3f0] text-[10px] text-[#504349] font-medium">Personal / Solitude</span>
          </div>
          <h4 className="font-serif text-lg font-medium text-[#1b1c1a] mb-2">
            First notebook entry in Kyoto
          </h4>
          <p className="font-serif text-xs text-[#504349] leading-relaxed line-clamp-3 mb-4 italic">
            Bought handmade mulberry washi paper in Teramachi. Learned that in calligraphy, negative space between characters dictates the gravity of the poem.
          </p>
          <div className="text-[11px] text-[#486369] font-medium bg-[#cbe8ef]/30 p-2.5 rounded-xl border border-[#cbe8ef]/60">
            Decision Preserved: Respect the margins as much as the text.
          </div>
        </div>
      </div>

      {/* Cognitive Sanctuary Rhythm */}
      <div className="p-6 rounded-2xl bg-[#efeeeb] border border-[#d4c2c9]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#1b1c1a] block">
            Cognitive Sanctuary Rhythm: 88.4 / 100
          </span>
          <span className="text-xs text-[#504349] font-serif italic">
            Reflective depth score calculated strictly within isolated local enclave.
          </span>
        </div>
        <button
          onClick={() => alert('Archive exported in archival Markdown + JSON format.')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#eae8e5] text-xs font-semibold text-[#1b1c1a] border border-[#d4c2c9] transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
          type="button"
        >
          <Download className="w-3.5 h-3.5 text-[#504349]" />
          <span>Share &amp; Preserve Archive</span>
        </button>
      </div>
    </div>
  );
};
