import React, { useState } from 'react';
import type { JournalEntry } from '../../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Sparkles, BookOpen } from 'lucide-react';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectEntry }) => {
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'timeline'>('month');
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-[#efeeeb]">
        <div>
          <span className="text-[10px] text-[#504349] uppercase tracking-wider font-semibold block mb-1">
            Chronological Perspective
          </span>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-3xl text-[#1b1c1a]">September 2026</h2>
            <div className="flex items-center gap-1 bg-[#efeeeb] rounded-lg p-0.5 border border-[#d4c2c9]/30">
              <button
                className="p-1 text-[#504349] hover:text-[#1b1c1a] rounded cursor-pointer"
                title="Previous month"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1 text-[#504349] hover:text-[#1b1c1a] rounded cursor-pointer"
                title="Next month"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#504349] mt-1 font-serif italic">
            Review reflections across personal and work chronicles through the lens of time.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#efeeeb] p-1 rounded-xl border border-[#d4c2c9]/30 shadow-2xs">
          <button
            onClick={() => setActiveTab('month')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'month' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Month
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'week' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Week
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline' ? 'bg-white text-[#1b1c1a] shadow-xs' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Writing Habit Rhythm Heatmap */}
      <div className="p-6 rounded-2xl bg-white border border-[#eae8e5] shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#854c6c]" />
            <span className="text-xs font-semibold text-[#1b1c1a]">Writing Habit Rhythm</span>
          </div>
          <span className="text-xs text-[#4a6550] font-semibold bg-[#ccead0]/40 px-2.5 py-0.5 rounded-full border border-[#ccead0]/60">
            88.4% Cadence Consistency
          </span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
          {daysInMonth.map((day) => {
            const hasEntry = day === 24 || day === 12 || day === 7 || day === 19 || day === 3 || day === 28;
            return (
              <div
                key={day}
                className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all cursor-default ${
                  hasEntry
                    ? 'bg-[#f9b2d7] text-[#784160] font-bold shadow-2xs'
                    : 'bg-[#f5f3f0] text-[#827379]'
                }`}
                title={`Day ${day}: ${hasEntry ? 'Reflection recorded' : 'Rest day'}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-[#eae8e5] shadow-xs p-6 mb-8">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#504349] pb-3 border-b border-[#efeeeb]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-3">
          {/* Leading empty days */}
          <div className="min-h-[88px] p-2.5 rounded-xl bg-[#fbf9f6]/40 opacity-40 text-xs text-[#827379]">31</div>
          {daysInMonth.map((day) => {
            const isToday = day === 24;
            const dayEntry = entries.find((e) => new Date(e.createdAt).getDate() === day) || (isToday ? entries[0] : null);

            return (
              <div
                key={day}
                onClick={() => dayEntry && onSelectEntry(dayEntry)}
                className={`min-h-[88px] p-2.5 rounded-xl border text-left transition-all duration-150 ${
                  isToday
                    ? 'bg-[#ffd8ea]/30 border-[#854c6c] shadow-2xs cursor-pointer hover:bg-[#ffd8ea]/50'
                    : dayEntry
                    ? 'bg-[#f5f3f0] border-[#d4c2c9]/60 cursor-pointer hover:border-[#854c6c] hover:shadow-2xs'
                    : 'bg-white border-[#efeeeb]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-mono ${isToday ? 'font-bold text-[#854c6c]' : 'text-[#504349]'}`}>
                    {day}
                  </span>
                  {dayEntry && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
                  )}
                </div>

                {dayEntry && (
                  <p className="text-[10px] font-serif text-[#1b1c1a] line-clamp-2 leading-tight">
                    {dayEntry.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
