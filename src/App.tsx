import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, JournalEntry, ActiveNavSection } from './types';
import { subscribeToAuthChanges, signOutUser } from './lib/firebase/client';
import {
  getUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from './lib/firestore/service';
import { LandingPage } from './components/auth/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotebookEditor } from './components/journal/NotebookEditor';
import { PastEntriesList } from './components/journal/PastEntriesList';
import { CalendarView } from './components/views/CalendarView';
import { MemoriesView } from './components/views/MemoriesView';
import { PlacesView } from './components/views/PlacesView';
import { SettingsView } from './components/views/SettingsView';
import { FirstEntrySetup } from './components/journal/FirstEntrySetup';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Journal and Navigation States
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveNavSection>('write');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'work' | 'personal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [returnSection, setReturnSection] = useState<ActiveNavSection | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen to Authentication lifecycle
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setActiveSection('search');
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  // When user is authenticated, load their isolated Realtime Database entries
  useEffect(() => {
    if (currentUser) {
      loadUserVault(currentUser.uid);
    } else {
      setEntries([]);
      setActiveEntry(null);
    }
  }, [currentUser]);

  const loadUserVault = async (uid: string) => {
    try {
      setSyncStatus('saving');
      const loaded = await getUserEntries(uid);
      setEntries(loaded);
      if (loaded.length > 0) {
        setActiveEntry(loaded[0]);
      } else {
        setActiveEntry(null);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Error loading user entries:', err);
      setSyncStatus('error');
    }
  };

  const handleNewEntryWithSetup = async (opts: { category: 'work' | 'personal'; pinLocation: boolean; pinType: JournalEntry['pinType'] }) => {
    if (!currentUser) return;
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now(),
      userId: currentUser.uid,
      title: '',
      content: '',
      category: opts.category,
      tags: [],
      wordCount: 0,
      readingTimeMinutes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Navigate immediately — don't wait for the database write
    setEntries((prev) => [newEntry, ...prev]);
    setActiveEntry(newEntry);
    setActiveSection('write');

    // Save in background
    setSyncStatus('saving');
    saveJournalEntry(currentUser.uid, newEntry)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'));

    // Pin GPS in background if requested
    if (opts.pinLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
          const state = data.address?.state || '';
          const country = data.address?.country_code?.toUpperCase() || '';
          const locationStr = [city, state, country].filter(Boolean).join(', ');
          const withLocation: JournalEntry = {
            ...newEntry,
            location: locationStr,
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            pinType: opts.pinType,
          };
          await saveJournalEntry(currentUser.uid, withLocation);
          setEntries((prev) => prev.map((e) => e.id === withLocation.id ? withLocation : e));
          setActiveEntry(withLocation);
        } catch { /* silent */ }
      }, () => { /* silent */ }, { enableHighAccuracy: true, timeout: 10000 });
    }
  };

  const handleNewEntry = async () => {
    if (!currentUser) return;
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now(),
      userId: currentUser.uid,
      title: '',
      content: '',
      category: selectedCategory === 'personal' ? 'personal' : 'work',
      tags: [],
      wordCount: 0,
      readingTimeMinutes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setActiveEntry(newEntry);
    setActiveSection('write');
    setSyncStatus('saving');
    saveJournalEntry(currentUser.uid, newEntry)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'));
  };

  const handleSaveEntry = async (updated: JournalEntry) => {
    if (!currentUser) return;
    setSyncStatus('saving');
    try {
      await saveJournalEntry(currentUser.uid, updated);
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setActiveEntry(updated);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to persist entry:', err);
      setSyncStatus('error');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!currentUser) return;
    await deleteJournalEntry(currentUser.uid, id);
    const filtered = entries.filter((e) => e.id !== id);
    setEntries(filtered);
    if (activeEntry?.id === id) {
      setActiveEntry(filtered[0] || null);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  // Filter entries according to active search and category
  const filteredEntries = entries.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const workEntriesCount = entries.filter((e) => e.category === 'work').length;
  const personalEntriesCount = entries.filter((e) => e.category === 'personal').length;
  const entryDays = new Set(
    entries
      .map((entry) => new Date(entry.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`),
  );
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  const streakStart = entryDays.has(todayKey) ? today : entryDays.has(yesterdayKey) ? yesterday : null;
  let streakCount = 0;
  if (streakStart) {
    const streakDate = new Date(streakStart);
    while (entryDays.has(`${streakDate.getFullYear()}-${streakDate.getMonth()}-${streakDate.getDate()}`)) {
      streakCount += 1;
      streakDate.setDate(streakDate.getDate() - 1);
    }
  }

  // 1. Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fbf9f6] flex flex-col items-center justify-center gap-4 text-[#1b1c1a]">
        <div className="w-10 h-10 rounded-xl bg-[#f9b2d7] text-[#784160] flex items-center justify-center font-serif text-xl font-bold shadow-sm animate-pulse">
          T
        </div>
        <p className="font-serif italic text-sm text-[#504349]">
          Entering quiet contemplative space...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Landing Page
  if (!currentUser) {
    return <LandingPage onAuthenticated={(user) => setCurrentUser(user)} />;
  }

  // 3. Authenticated State -> Private Digital Notebook & Enclave
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1b1c1a] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setReturnSection(null);
        }}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        workEntriesCount={workEntriesCount}
        personalEntriesCount={personalEntriesCount}
        streakCount={streakCount}
        collapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      {/* Main Sanctuary Canvas */}
      <main className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 max-md:ml-0 ${sidebarCollapsed ? 'ml-20' : 'ml-80 max-xl:ml-72'}`}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim()) setActiveSection('search');
          }}
          syncStatus={syncStatus}
          onOpenSearchModal={() => setActiveSection('search')}
          searchInputRef={searchInputRef}
        />

        <div className="flex-1 pb-16">
          {activeSection === 'write' && activeEntry && (
            <NotebookEditor
              key={activeEntry.id}
              entry={activeEntry}
              user={currentUser}
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
              onBack={returnSection === 'calendar' ? () => {
                setActiveSection('calendar');
                setReturnSection(null);
              } : undefined}
            />
          )}

          {activeSection === 'write' && !activeEntry && (
            <FirstEntrySetup onCreateEntry={handleNewEntryWithSetup} />
          )}

          {activeSection === 'search' && (
            <PastEntriesList
              entries={filteredEntries}
              activeEntryId={activeEntry?.id || ''}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveSection('write');
                setReturnSection(null);
              }}
              onDeleteEntry={handleDeleteEntry}
              onNewEntry={handleNewEntry}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              entries={entries}
              user={currentUser}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveSection('write');
                setReturnSection('calendar');
              }}
            />
          )}

          {activeSection === 'on-this-day' && (
            <MemoriesView
              entries={entries}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveSection('write');
              }}
            />
          )}

          {activeSection === 'places' && (
            <PlacesView
              entries={entries}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveSection('write');
              }}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              user={currentUser}
              onDataPurged={() => loadUserVault(currentUser.uid)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
