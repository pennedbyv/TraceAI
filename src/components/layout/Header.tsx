import React from 'react';
import { Search, Share2, Loader2, AlertCircle, Bell } from 'lucide-react';

interface HeaderProps {
  selectedCategory: 'all' | 'work' | 'personal';
  onSelectCategory: (cat: 'all' | 'work' | 'personal') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncStatus: 'synced' | 'saving' | 'error';
  lastSavedText?: string;
  onOpenSearchModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  syncStatus,
  lastSavedText = 'All notes synced to private vault',
  onOpenSearchModal,
}) => {
  const syncLabel = syncStatus === 'saving'
    ? 'Persisting to Firestore...'
    : syncStatus === 'error'
      ? 'Firestore sync failed'
      : lastSavedText;

  return (
    <header className="sticky top-0 bg-[#f8f7f4]/92 backdrop-blur-md px-12 py-5 flex items-center justify-between z-40 border-b border-[#e3dedb] select-none max-xl:px-6 max-md:px-4">
      <div className="flex items-center gap-8">
        {/* Category switcher pills */}
        <div className="flex items-center gap-1 p-1 bg-[#e7e4e1] rounded-full border border-[#d4c2c9]/25 shadow-2xs">
          <button
            onClick={() => onSelectCategory('all')}
              className={`px-6 py-2 rounded-full text-base transition-all duration-150 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-[#1b1c1a] font-semibold shadow-xs'
                : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
              Work
          </button>
          <button
            onClick={() => onSelectCategory('work')}
              className={`px-6 py-2 rounded-full text-base transition-all duration-150 cursor-pointer ${
              selectedCategory === 'work'
                ? 'bg-white text-[#1b1c1a] font-semibold shadow-xs'
                : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
              Personal
          </button>
          <button
            onClick={() => onSelectCategory('personal')}
            className={`px-3 py-1 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
              selectedCategory === 'personal'
                ? 'bg-white text-[#1b1c1a] font-semibold shadow-xs'
                : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            Personal
          </button>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#504349]">
          {syncStatus === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 text-[#854c6c] animate-spin" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#4a6550]" />
          )}
          <span className="text-sm text-[#504349]">
            {syncLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#827379]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries"
            className="pl-11 pr-14 py-3 rounded-2xl bg-[#eeece9] text-sm text-[#1b1c1a] placeholder:text-[#827379] focus:outline-none focus:ring-1 focus:ring-[#854c6c] focus:bg-white w-48 sm:w-72 transition-all border border-transparent focus:border-[#d4c2c9]"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#504349] bg-white px-1.5 py-0.5 rounded-md border border-[#d4c2c9]/40 shadow-2xs font-mono">
            ⌘K
          </kbd>
        </div>

        <button
          onClick={() => alert('Reflection link copied to clipboard.')}
          className="flex items-center gap-2 px-5 py-3 text-[#1b1c1a] hover:bg-white rounded-2xl border border-[#e3dedb] transition-colors cursor-pointer"
          title="Share note or export"
          type="button"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">Share</span>
        </button>
        <button className="relative p-2 text-[#504349] hover:text-[#1b1c1a] cursor-pointer" type="button" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f4a9d1]" />
        </button>
      </div>
    </header>
  );
};
