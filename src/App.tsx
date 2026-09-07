import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, JournalEntry, ActiveNavSection } from './types';
import { subscribeToAuthChanges, signOutUser } from './lib/firebase/client';
import {
  getUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from './lib/firestore/service';
import { Flower2, Palette, PenLine, Sparkles } from 'lucide-react';
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

const artistFacts = [
  { artist: 'Amrita Sher-Gil', fact: 'She brought European modernism and Indian visual life into one vivid, unmistakable language.', icon: Palette },
  { artist: 'Raja Ravi Varma', fact: 'He made mythological scenes feel close to home through oil painting and widely circulated prints.', icon: PenLine },
  { artist: 'Jamini Roy', fact: 'He turned to Bengali folk traditions to create art that felt direct, graphic, and deeply local.', icon: Flower2 },
  { artist: 'S. H. Raza', fact: 'His famous bindu became a quiet center of gravity for paintings about energy, nature, and existence.', icon: Sparkles },
  { artist: 'M. F. Husain', fact: 'He found movement in simplified forms, bringing cinema, mythology, and everyday India onto large canvases.', icon: PenLine },
  { artist: 'Nalini Malani', fact: 'Her layered installations explore memory, violence, and the many stories carried by a single image.', icon: Palette },
];

const minimumAuthLoadingMs = 3000;

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
  const [artistFactIndex, setArtistFactIndex] = useState(0);
  const authLoadingStartedAt = useRef(Date.now());
  const authLoadingTimer = useRef<number | null>(null);

  // Listen to Authentication lifecycle
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      const elapsed = Date.now() - authLoadingStartedAt.current;
      const remaining = Math.max(0, minimumAuthLoadingMs - elapsed);
      if (authLoadingTimer.current !== null) {
        window.clearTimeout(authLoadingTimer.current);
      }
      if (remaining === 0) {
        setAuthLoading(false);
      } else {
        authLoadingTimer.current = window.setTimeout(() => {
          setAuthLoading(false);
          authLoadingTimer.current = null;
        }, remaining);
      }
    });
    return () => {
      unsubscribe();
      if (authLoadingTimer.current !== null) {
        window.clearTimeout(authLoadingTimer.current);
      }
    };
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

  useEffect(() => {
    const factTimer = window.setInterval(() => {
      setArtistFactIndex((index) => (index + 1) % artistFacts.length);
    }, 4500);
    return () => window.clearInterval(factTimer);
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
      title: 'Untitled Reflection',
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
      title: 'Untitled Reflection',
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
    const currentFact = artistFacts[artistFactIndex];
    const FactIcon = currentFact.icon;

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fbf9f6] px-6 text-[#1b1c1a]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f9b2d7]/15 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-7 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9b2d7] text-[#784160] shadow-[0_12px_30px_rgba(133,76,108,0.18)] animate-pulse">
            <div className="absolute inset-2 rounded-[19px] border border-white/60" />
            <FactIcon className="h-8 w-8" strokeWidth={1.5} />
            <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-[#fbf9f6] bg-[#4a6550] animate-bounce" />
          </div>

          <p className="font-serif text-lg italic text-[#504349]">Opening a little room for thought...</p>
          <div className="mt-2 h-1 w-36 overflow-hidden rounded-full bg-[#efeeeb]">
            <div className="h-full w-1/2 rounded-full bg-[#854c6c] animate-[loading-sweep_1.8s_ease-in-out_infinite]" />
          </div>

          <div className="mt-12 max-w-md border-t border-[#d4c2c9]/50 pt-5">
            <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#854c6c]">
              <Sparkles className="h-3 w-3" />
              A small art fact
              <Sparkles className="h-3 w-3" />
            </div>
            <p key={currentFact.artist} className="font-serif text-xl text-[#1b1c1a] animate-[fact-reveal_450ms_ease-out]">
              {currentFact.fact}
            </p>
            <p className="mt-3 text-xs font-semibold text-[#4a6550]">{currentFact.artist}</p>
          </div>
        </div>
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
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setActiveSection('search');
          setReturnSection(null);
        }}
      />

      {/* Main Sanctuary Canvas */}
      <main className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 max-md:ml-0 ${sidebarCollapsed ? 'ml-20' : 'ml-72 max-xl:ml-64'}`}>
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
