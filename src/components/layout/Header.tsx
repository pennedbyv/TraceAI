import React from 'react';
import { Search, Share2, Loader2, AlertCircle, Bell, Cloud } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncStatus: 'synced' | 'saving' | 'error';
  lastSavedText?: string;
  onOpenSearchModal: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  syncStatus,
  lastSavedText = 'All notes synced to private vault',
  onOpenSearchModal,
  searchInputRef,
}) => {
  const syncLabel = syncStatus === 'saving'
    ? 'Persisting to Realtime Database...'
    : syncStatus === 'error'
      ? 'Realtime Database sync failed'
      : lastSavedText;

  return (
    <header className="sticky top-0 bg-[#f8f7f4]/92 backdrop-blur-md px-12 py-5 flex items-center justify-end z-40 border-b border-[#e3dedb] select-none max-xl:px-6 max-md:px-4">
      <div className="flex items-center gap-4">
        {/* Sync Status Badge */}
        <div className="hidden min-w-0 items-center gap-2 text-xs text-[#504349] sm:flex">
          <Cloud className={`h-3.5 w-3.5 shrink-0 ${
            syncStatus === 'synced' ? 'text-[#4a6550]' : syncStatus === 'error' ? 'text-[#ba1a1a]' : 'text-[#854c6c]'
          }`} aria-hidden="true" />
          {syncStatus === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 text-[#854c6c] animate-spin" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#4a6550]" />
          )}
          <span className={`truncate whitespace-nowrap text-sm ${
            syncStatus === 'synced' ? 'text-[#4a6550]' : syncStatus === 'error' ? 'text-[#ba1a1a]' : 'text-[#854c6c]'
          }`}>
            {syncLabel}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#827379]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onOpenSearchModal}
            placeholder="Search entries"
            className="w-[min(36vw,15rem)] rounded-xl border border-transparent bg-[#eeece9] py-2.5 pl-10 pr-12 text-sm text-[#1b1c1a] placeholder:text-[#827379] transition-all focus:border-[#d4c2c9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#854c6c] max-sm:w-[min(48vw,12rem)]"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#504349] bg-white px-1.5 py-0.5 rounded-md border border-[#d4c2c9]/40 shadow-2xs font-mono">
          <b>Ctrl+S</b>
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
