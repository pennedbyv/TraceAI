import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore } from '../firebase/client';
import type { JournalEntry, CompanionInteraction } from '../../types';

/**
 * Strips all undefined properties from objects to prevent Firestore write exceptions.
 * OWASP & Payload Hygiene standard.
 */
function sanitizePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload));
}

// Local storage prefix strictly scoped by user UID for sandbox isolation
const getLocalEntriesKey = (uid: string) => `trace_vault_${uid}_entries`;
const getLocalInteractionsKey = (uid: string) => `trace_vault_${uid}_interactions`;

export const INITIAL_SAMPLE_ENTRY: JournalEntry = {
  id: 'sample_initial_entry',
  userId: 'default',
  title: 'Designing with conviction and quiet discipline',
  category: 'work',
  tags: ['Work', 'Strategy', 'Architecture', 'Presidio Studio, SF'],
  wordCount: 482,
  readingTimeMinutes: 2,
  location: 'Mission District, SF',
  weather: 'Fog clearing, 59°F',
  reflectionTone: 'Reflective, steady, grounded',
  marginNotes: [
    'Oct 12 • The Psychology of Felt Feedback: A screen without tactile resistance breeds cognitive wandering; physical bookbinding invites anchored presence.'
  ],
  content: `True digital craftsmanship demands that we occasionally turn off the relentless chorus of metrics and look at the stillness of the medium itself. Today at the studio, watching morning light rake across raw sketchbook paper, I realized that true software ergonomics don't emulate clinical dashboards—they evoke tactile sanctuaries.

When thoughts are allowed to decelerate, clarity stops being a competitive chase and transforms into an architectural habit. We have grown accustomed to treating creative ideation as an endless backlog of high-velocity sprints. But the mind functions more like handmade wove paper: it absorbs, expands, breathes, and quietly sets.

Three core design constraints became obvious while walking through the cypress groves near the coast:

• Principle 01 — Physical Restraint: Surfaces must possess tangible boundaries, like edges of physical parchment.
• Principle 02 — Deliberate Typestyle: Ink-weight serifs offer contemplative pacing over rapid skimming scans.
• Principle 03 — Asynchronous Reflection: Insight synthesis must wait until the day's pulse settles into dusk.

We do not need more notification chimes; we need more silent folios where ideas can sit undisturbed until maturity.`,
  createdAt: '2024-10-24T09:41:00.000Z',
  updatedAt: '2024-10-24T09:41:00.000Z',
};

/**
 * Save or update a journal entry strictly isolated to the user's UID path:
 * users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('User identity UID is required to save private journal data.');
  }

  if (!firestore) {
    throw new Error('Firestore is not configured. Add the VITE_FIREBASE_* values and restart the app.');
  }

  const cleanEntry = sanitizePayload({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });

  try {
    const entryRef = doc(firestore, 'users', userId, 'entries', entry.id);
    await setDoc(entryRef, cleanEntry, { merge: true });
    removeLocalEntry(userId, entry.id);
  } catch (err) {
    console.error('Firestore journal write failed:', err);
    throw new Error('Journal could not be saved to Firestore. Check your Firebase rules and connection.');
  }
}

/**
 * Retrieve all journal entries belonging strictly to the current user's UID.
 */
export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  if (!firestore) {
    throw new Error('Firestore is not configured. Add the VITE_FIREBASE_* values and restart the app.');
  }

  try {
    const entriesCol = collection(firestore, 'users', userId, 'entries');
    const q = query(entriesCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const list: JournalEntry[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as JournalEntry);
    });

    // Recover drafts written by the previous local fallback into Firestore once.
    const localEntries = getLocalEntries(userId);
    const remoteIds = new Set(list.map((entry) => entry.id));
    const entriesToMigrate = localEntries.filter((entry) => !remoteIds.has(entry.id));
    if (entriesToMigrate.length > 0) {
      await Promise.all(entriesToMigrate.map((entry) => saveJournalEntry(userId, entry)));
      list.push(...entriesToMigrate);
    }

    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.error('Firestore journal query failed:', err);
    throw new Error('Journal entries could not be loaded from Firestore. Check your Firebase rules and connection.');
  }
}

function getLocalEntries(userId: string): JournalEntry[] {
  const key = getLocalEntriesKey(userId);
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function removeLocalEntry(userId: string, entryId: string): void {
  const existing = getLocalEntries(userId);
  const remaining = existing.filter((entry) => entry.id !== entryId);
  if (remaining.length === 0) {
    localStorage.removeItem(getLocalEntriesKey(userId));
    return;
  }
  localStorage.setItem(getLocalEntriesKey(userId), JSON.stringify(remaining));
}

/**
 * Save multi-turn Gemini companion interaction strictly under:
 * users/{userId}/interactions/{interactionId}
 */
export async function saveCompanionInteraction(
  userId: string,
  interaction: CompanionInteraction
): Promise<void> {
  if (!userId) return;

  const cleanPayload = sanitizePayload({
    ...interaction,
    userId,
    timestamp: interaction.timestamp || new Date().toISOString(),
  });

  if (firestore) {
    try {
      const docRef = doc(firestore, 'users', userId, 'interactions', interaction.id);
      await setDoc(docRef, cleanPayload, { merge: true });
      return;
    } catch (err) {
      console.warn('Firestore interaction write failed, using local store:', err);
    }
  }

  const key = getLocalInteractionsKey(userId);
  const existing = getUserInteractions(userId);
  const updated = [cleanPayload, ...existing];
  localStorage.setItem(key, JSON.stringify(updated));
}

/**
 * Retrieve user's past Gemini AI interactions
 */
export function getUserInteractions(userId: string): CompanionInteraction[] {
  if (!userId) return [];
  const key = getLocalInteractionsKey(userId);
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Delete an entry securely
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (firestore) {
    try {
      const docRef = doc(firestore, 'users', userId, 'entries', entryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  }

  const key = getLocalEntriesKey(userId);
  const existing = getLocalEntries(userId);
  const filtered = existing.filter((e) => e.id !== entryId);
  localStorage.setItem(key, JSON.stringify(filtered));
}

/**
 * Shred/Purge all user data from isolated storage (Danger Zone)
 */
export async function purgeAllUserData(userId: string): Promise<void> {
  if (!userId) return;
  localStorage.removeItem(getLocalEntriesKey(userId));
  localStorage.removeItem(getLocalInteractionsKey(userId));
}
