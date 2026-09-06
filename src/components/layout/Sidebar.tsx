import React from 'react';
import type { UserProfile, ActiveNavSection } from '../../types';
import {
  PenLine,
  Sparkles,
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Settings as SettingsIcon,
  LogOut,
  Flower2,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  activeSection: ActiveNavSection;
  onSelectSection: (section: ActiveNavSection) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  workEntriesCount: number;
  personalEntriesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeSection,
  onSelectSection,
  onNewEntry,
  onSignOut,
  workEntriesCount,
  personalEntriesCount,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#f5f3f0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto border-r border-[#d4c2c9]/30 select-none">
      <div className="p-6 flex flex-col gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[#f9b2d7] text-[#784160] shadow-xs font-serif font-bold text-lg">
            T
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl text-[#1b1c1a] tracking-tight leading-none">Trace</span>
            <span className="text-[10px] text-[#504349] tracking-widest uppercase mt-1 font-medium">Mindful Studio</span>
          </div>
        </div>

        {/* New Entry Button */}
        <button
          onClick={onNewEntry}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f9b2d7] text-[#784160] hover:bg-[#ffd8ea] text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(133,76,108,0.12)] cursor-pointer"
          type="button"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Entry</span>
        </button>

        {/* Primary Navigation */}
        <div className="mt-2">
          <span className="text-[10px] text-[#504349] uppercase tracking-wider px-2 mb-2 block font-semibold">
            Navigation
          </span>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => onSelectSection('write')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                activeSection === 'write'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-[#854c6c]" />
                <span className="text-xs">Write</span>
              </div>
              {activeSection === 'write' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
              )}
            </button>

            <button
              onClick={() => onSelectSection('on-this-day')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                activeSection === 'on-this-day'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#486369]" />
                <span className="text-xs">On This Day</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cbe8ef] text-[#021f24] font-medium">
                3 yrs
              </span>
            </button>

            <button
              onClick={() => onSelectSection('search')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                activeSection === 'search'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-[#504349]" />
                <span className="text-xs">Search</span>
              </div>
              <span className="text-[10px] text-[#827379] font-mono">⌘K</span>
            </button>

            <button
              onClick={() => onSelectSection('calendar')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                activeSection === 'calendar'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-[#784160]" />
                <span className="text-xs">Calendar</span>
              </div>
              {activeSection === 'calendar' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
              )}
            </button>

            <button
              onClick={() => onSelectSection('places')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                activeSection === 'places'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#4a6550]" />
                <span className="text-xs">Places</span>
              </div>
              <span className="text-[10px] text-[#504349] truncate max-w-[80px]">Kyoto / SF</span>
            </button>
          </nav>
        </div>

        {/* Collections */}
        <div className="mt-1">
          <span className="text-[10px] text-[#504349] uppercase tracking-wider px-2 mb-2 block font-semibold">
            Collections
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#504349]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#cbe8ef]" />
                <span className="text-xs">Work</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#efeeeb] text-[#504349] font-mono font-medium">
                {workEntriesCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#504349]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f9b2d7]" />
                <span className="text-xs">Personal</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#efeeeb] text-[#504349] font-mono font-medium">
                {personalEntriesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Streak Ribbon Badge */}
        <div className="p-3 rounded-xl bg-[#efeeeb] border border-[#d4c2c9]/30 flex items-center justify-between mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#ccead0] flex items-center justify-center text-[#3e5944]">
              <Flower2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#1b1c1a]">14-day streak</span>
              <span className="text-[10px] text-[#504349]">Quiet cadence</span>
            </div>
          </div>
          <span className="text-[10px] text-[#4a6550] font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-[#ccead0]">
            Active
          </span>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#d4c2c9]/30 flex flex-col gap-3 bg-[#f5f3f0]">
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => onSelectSection('settings')}
            className={`flex items-center gap-2 text-xs transition-colors cursor-pointer ${
              activeSection === 'settings' ? 'text-[#1b1c1a] font-semibold' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            type="button"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="font-medium">Settings</span>
          </button>
          <span className="text-[10px] text-[#4a6550] font-mono bg-[#ccead0]/60 px-2 py-0.5 rounded border border-[#ccead0]">
            UID: {user.uid.slice(0, 6)}...
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-[#d4c2c9]/30 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#d4c2c9]"
              src={user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg'}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#1b1c1a] truncate">
                {user.displayName || 'Elena Rostova'}
              </span>
              <span className="text-[10px] text-[#504349] truncate max-w-[120px]">
                {user.email || 'private@trace.journal'}
              </span>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-[#504349] hover:text-[#ba1a1a] p-1.5 rounded-lg hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
            title="Sign out of journal"
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
