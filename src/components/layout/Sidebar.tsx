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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  activeSection: ActiveNavSection;
  onSelectSection: (section: ActiveNavSection) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  workEntriesCount: number;
  personalEntriesCount: number;
  streakCount: number;
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeSection,
  onSelectSection,
  onNewEntry,
  onSignOut,
  workEntriesCount,
  personalEntriesCount,
  streakCount,
  collapsed,
  onToggleSidebar,
}) => {
  return (
    <aside className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between overflow-y-auto border-r border-[#e3dedb] bg-[#f4f2ef] select-none transition-[width,transform] duration-200 max-md:w-[min(86vw,320px)] ${collapsed ? 'w-20 max-xl:w-20 max-md:-translate-x-full' : 'w-80 max-xl:w-72 max-md:translate-x-0'}`}>
      <div className={`flex flex-col gap-7 max-xl:gap-4 ${collapsed ? 'p-4' : 'p-12 max-xl:p-6'}`}>
        {/* Brand Header */}
        <div className={`mb-6 flex items-center ${collapsed ? 'flex-col justify-center gap-3' : 'justify-between gap-5'}`}>
          <img src="/assets/trace-logo.png" alt="Trace logo" className={`${collapsed ? 'h-12 w-12 rounded-xl' : 'h-16 w-16 rounded-2xl'} shrink-0 object-contain shadow-[0_5px_12px_rgba(120,65,96,0.12)]`} />
          {!collapsed && <div className="flex flex-col">
            <span className="font-serif text-4xl leading-none tracking-tight text-[#1b1c1a]">Trace</span>
          </div>
          }
          <button
            onClick={onToggleSidebar}
            className="shrink-0 rounded-xl border border-[#e3dedb] bg-white p-2.5 text-[#504349] transition-colors hover:text-[#1b1c1a]"
            type="button"
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* New Entry Button */}
        <button
          onClick={onNewEntry}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f4a9d1] px-4 text-[#784160] shadow-[0_5px_12px_rgba(133,76,108,0.12)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ffd8ea] ${collapsed ? 'py-3' : 'py-5 text-lg'} cursor-pointer`}
          type="button"
        >
          <PlusCircle className="w-4 h-4" />
          {!collapsed && <span>New Entry</span>}
        </button>

        {/* Primary Navigation */}
        <div className="mt-2">
          {!collapsed && <span className="text-sm text-[#504349] uppercase tracking-wide px-2 mb-3 block font-medium">
            Navigation
          </span>}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => onSelectSection('write')}
              className={`flex items-center rounded-2xl text-left transition-colors cursor-pointer ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-4'} ${
                activeSection === 'write'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-[#854c6c]" />
                {!collapsed && <span className="text-lg">Write</span>}
              </div>
              {activeSection === 'write' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
              )}
            </button>

            <button
              onClick={() => onSelectSection('on-this-day')}
              className={`flex items-center rounded-2xl text-left transition-colors cursor-pointer ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-4'} ${
                activeSection === 'on-this-day'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#486369]" />
                {!collapsed && <span className="text-lg">On This Day</span>}
              </div>
              {!collapsed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cbe8ef] text-[#021f24] font-medium">
                3 yrs
              </span>}
            </button>

            <button
              onClick={() => onSelectSection('search')}
              className={`flex items-center rounded-2xl text-left transition-colors cursor-pointer ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-4'} ${
                activeSection === 'search'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-[#504349]" />
                {!collapsed && <span className="text-lg">Search</span>}
              </div>
              {!collapsed && <span className="text-[10px] text-[#827379] font-mono">⌘K</span>}
            </button>

            <button
              onClick={() => onSelectSection('calendar')}
              className={`flex items-center rounded-2xl text-left transition-colors cursor-pointer ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-4'} ${
                activeSection === 'calendar'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-[#784160]" />
                {!collapsed && <span className="text-lg">Calendar</span>}
              </div>
              {activeSection === 'calendar' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#854c6c]" />
              )}
            </button>

            <button
              onClick={() => onSelectSection('places')}
              className={`flex items-center rounded-2xl text-left transition-colors cursor-pointer ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-4'} ${
                activeSection === 'places'
                  ? 'bg-[#e4e2df] text-[#1b1c1a] font-semibold shadow-2xs'
                  : 'text-[#504349] hover:bg-[#efeeeb] hover:text-[#1b1c1a]'
              }`}
              type="button"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#4a6550]" />
                {!collapsed && <span className="text-lg">Places</span>}
              </div>
            </button>
          </nav>
        </div>

        {/* Collections */}
        {!collapsed && <div className="mt-1">
            <span className="text-sm text-[#504349] uppercase tracking-wide px-2 mb-3 block font-medium">
            Collections
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#504349]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#cbe8ef]" />
                <span className="text-lg">Work</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#efeeeb] text-[#504349] font-mono font-medium">
                {workEntriesCount}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#504349]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#f9b2d7]" />
                <span className="text-lg">Personal</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#efeeeb] text-[#504349] font-mono font-medium">
                {personalEntriesCount}
              </span>
            </div>
          </div>
        </div>}

        {/* Streak Ribbon Badge */}
        {!collapsed && <div className="mt-2 flex items-center justify-between rounded-2xl border border-[#d4c2c9]/50 bg-[#efeeeb] p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#ccead0] flex items-center justify-center text-[#3e5944]">
              <Flower2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#1b1c1a]">{streakCount}-day streak</span>
              <span className="text-[10px] text-[#504349]">{streakCount > 0 ? 'Quiet cadence' : 'Start today'}</span>
            </div>
          </div>
          <span className="text-[10px] text-[#4a6550] font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-[#ccead0]">
            Active
          </span>
        </div>}
      </div>

      {/* User Profile Footer */}
      <div className={`flex flex-col gap-5 border-t border-[#d4c2c9]/30 bg-[#f4f2ef] ${collapsed ? 'items-center p-3' : 'p-8 max-xl:p-4'}`}>
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => onSelectSection('settings')}
            className={`flex items-center gap-2 rounded-lg text-xs transition-colors cursor-pointer ${collapsed ? 'justify-center p-2' : ''} ${
              activeSection === 'settings' ? 'text-[#1b1c1a] font-semibold' : 'text-[#504349] hover:text-[#1b1c1a]'
            }`}
            title="Settings"
            type="button"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </button>
          {!collapsed && <span className="text-[10px] text-[#4a6550] font-mono bg-[#ccead0]/60 px-2 py-0.5 rounded border border-[#ccead0]">
            UID: {user.uid.slice(0, 6)}...
          </span>}
        </div>

        <div className={`flex items-center justify-between rounded-xl border border-[#d4c2c9]/30 bg-white/80 p-2 shadow-2xs ${collapsed ? 'border-transparent bg-transparent' : ''}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#d4c2c9]"
              src={user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg'}
            />
            {!collapsed && <div className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold text-[#1b1c1a] truncate">
                {user.displayName || ''}
              </span>
              <span className="text-[10px] text-[#504349] truncate max-w-[120px]">
                {user.email || 'private@trace.journal'}
              </span>
            </div>}
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
