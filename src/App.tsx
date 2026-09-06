import React, { useState, useEffect } from 'react';
import type { UserProfile, JournalEntry, ActiveNavSection } from './types';
import { subscribeToAuthChanges, signOutUser } from './lib/firebase/client';
import {
  getUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
  INITIAL_SAMPLE_ENTRY,
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

  // Listen to Authentication lifecycle
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When user is authenticated, load their isolated Firestore entries
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
        const freshEntry: JournalEntry = {
          ...INITIAL_SAMPLE_ENTRY,
          id: 'entry_' + Date.now(),
          userId: uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveJournalEntry(uid, freshEntry);
        setEntries([freshEntry]);
        setActiveEntry(freshEntry);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Error loading user entries:', err);
      setSyncStatus('error');
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
      tags: [selectedCategory === 'personal' ? 'Personal' : 'Work'],
      wordCount: 0,
      readingTimeMinutes: 1,
      location: 'Mission District, SF',
      weather: 'Clear dusk, 62°F',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSyncStatus('saving');
    try {
      await saveJournalEntry(currentUser.uid, newEntry);
      setEntries((prev) => [newEntry, ...prev]);
      setActiveEntry(newEntry);
      setActiveSection('write');
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to create entry:', err);
      setSyncStatus('error');
    }
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
        onSelectSection={(sec) => setActiveSection(sec)}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        workEntriesCount={workEntriesCount}
        personalEntriesCount={personalEntriesCount}
        streakCount={streakCount}
      />

      {/* Main Sanctuary Canvas */}
      <main className="flex-1 ml-[360px] flex flex-col min-h-screen max-xl:ml-72 max-md:ml-0">
        <Header
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          syncStatus={syncStatus}
          onOpenSearchModal={() => setActiveSection('search')}
        />

        <div className="flex-1 pb-16">
          {activeSection === 'write' && activeEntry && (
            <NotebookEditor
              key={activeEntry.id}
              entry={activeEntry}
              user={currentUser}
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          )}

          {activeSection === 'write' && !activeEntry && (
            <div className="max-w-md mx-auto my-24 text-center p-8 bg-white rounded-xl border border-[#eae8e5]">
              <h3 className="font-serif text-xl mb-2">No active reflection</h3>
              <p className="text-xs text-[#504349] mb-4">
                Begin a new notebook leaf in your private vault.
              </p>
              <button
                onClick={handleNewEntry}
                className="px-4 py-2 rounded-lg bg-[#f9b2d7] text-[#784160] text-xs font-semibold"
                type="button"
              >
                Create First Entry
              </button>
            </div>
          )}

          {activeSection === 'search' && (
            <PastEntriesList
              entries={filteredEntries}
              activeEntryId={activeEntry?.id || ''}
              onSelectEntry={(entry) => {
                setActiveEntry(entry);
                setActiveSection('write');
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
