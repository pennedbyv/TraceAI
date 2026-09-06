export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'work' | 'personal';
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
  location?: string;
  weather?: string;
  reflectionTone?: string;
  marginNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanionInteraction {
  id: string;
  userId: string;
  entryId?: string;
  command: '/gem' | '/ask' | '/summarise' | '/prompt' | '/quotes';
  prompt: string;
  response: string;
  modelUsed: string;
  timestamp: string;
  suggestion?: string;
}

export interface MemoryFlashback {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'work' | 'personal';
  decision: string;
}

export interface GeographicLocation {
  id: string;
  city: string;
  region: string;
  coordinates: string;
  entriesCount: number;
  wordCount: string;
  prevailingTone: string;
  topographicAtmosphere: string;
  soundAmbiance: string;
  pinned: boolean;
}

export type ActiveNavSection = 'write' | 'on-this-day' | 'search' | 'calendar' | 'places' | 'settings';
