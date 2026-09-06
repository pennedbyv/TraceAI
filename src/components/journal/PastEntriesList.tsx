import React from 'react';
import type { JournalEntry } from '../../types';
import { Plus, Trash2, Calendar, FileText } from 'lucide-react';

interface PastEntriesListProps {
  entries: JournalEntry[];
  activeEntryId: string;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onNewEntry: () => void;
}

export const PastEntriesList: React.FC<PastEntriesListProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#efeeeb]">
        <div>
          <h2 className="font-serif text-3xl text-[#1b1c1a]">Chronicle &amp; Vault Entries</h2>
          <p className="text-xs text-[#504349] mt-1 font-serif italic">
            {entries.length} reflections securely preserved under your authenticated identity
          </p>
        </div>
        <button
          onClick={onNewEntry}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f9b2d7] text-[#784160] text-xs font-semibold hover:bg-[#ffd8ea] transition-all shadow-xs cursor-pointer"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>New Reflection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {entries.map((item) => {
          const isSelected = item.id === activeEntryId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectEntry(item)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer bg-white ${
                isSelected
                  ? 'border-[#854c6c] shadow-md ring-1 ring-[#854c6c]'
                  : 'border-[#eae8e5] hover:border-[#d4c2c9] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      item.category === 'personal'
                        ? 'bg-[#f9b2d7]/50 text-[#784160]'
                        : 'bg-[#cbe8ef] text-[#021f24]'
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs text-[#827379] font-serif italic">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#504349] font-mono text-[11px]">{item.wordCount || 0} words</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Permanently remove this entry from your vault?')) {
                        onDeleteEntry(item.id);
                      }
                    }}
                    className="p-1.5 text-[#827379] hover:text-[#ba1a1a] rounded-lg hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                    title="Delete entry"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-serif text-xl font-medium text-[#1b1c1a] mb-2 leading-snug">
                {item.title || 'Untitled Entry'}
              </h3>

              <p className="font-serif text-xs text-[#504349] line-clamp-2 leading-relaxed mb-4">
                {item.content}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#f5f3f0]">
                {item.tags &&
                  item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-0.5 rounded-full bg-[#f5f3f0] text-[10px] text-[#504349] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
