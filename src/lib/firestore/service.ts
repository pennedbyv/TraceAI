import { get, onValue, ref, remove, set } from 'firebase/database';
import { database } from '../firebase/client';
import type { JournalEntry, CompanionInteraction } from '../../types';

/**
 * Strips all undefined properties from objects before database writes.
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
 * Save or update a journal entry strictly isolated to the user's UID path
 * in Realtime Database: users/{userId}/entries/{entryId}.
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('User identity UID is required to save private journal data.');
  }

  if (!database) {
    throw new Error('Realtime Database is not configured. Add the VITE_FIREBASE_* values and restart the app.');
  }

  const cleanEntry = sanitizePayload({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });

  try {
    const entryRef = ref(database, `users/${userId}/entries/${entry.id}`);
    await set(entryRef, cleanEntry);
    removeLocalEntry(userId, entry.id);
  } catch (err) {
    console.error('Realtime Database journal write failed:', err);
    throw new Error('Journal could not be saved to Realtime Database. Check your Firebase rules and connection.');
  }
}

/**
 * Retrieve all journal entries belonging strictly to the current user's UID.
 */
export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  if (!database) {
    throw new Error('Realtime Database is not configured. Add the VITE_FIREBASE_* values and restart the app.');
  }

  try {
    const snapshot = await get(ref(database, `users/${userId}/entries`));
    const data = snapshot.val() as Record<string, JournalEntry> | null;
    const remoteEntries = data ? Object.values(data) : [];

    // Recover drafts written by the previous local fallback into Firestore once.
    const localEntries = getLocalEntries(userId);
    const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
    const entriesToMigrate = localEntries.filter((entry) => !remoteIds.has(entry.id));
    if (entriesToMigrate.length > 0) {
      await Promise.all(entriesToMigrate.map((entry) => saveJournalEntry(userId, entry)));
    }

    const uniqueEntries = new Map<string, JournalEntry>();
    [...remoteEntries, ...entriesToMigrate].forEach((entry) => uniqueEntries.set(entry.id, entry));
    return [...uniqueEntries.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.error('Realtime Database journal query failed:', err);
    const code = (err as { code?: string }).code;
    throw new Error(code
      ? `Realtime Database error (${code}). Check the database URL and rules.`
      : 'Journal entries could not be loaded from Realtime Database. Check your Firebase rules and connection.');
  }
}

/**
 * Subscribe to the user's entries so changes from other tabs or devices arrive immediately.
 */
export function subscribeToUserEntries(
  userId: string,
  onEntries: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void,
): () => void {
  if (!userId || !database) {
    onError(new Error('Realtime Database is not configured. Add the VITE_FIREBASE_* values and restart the app.'));
    return () => {};
  }

  let migrationAttempted = false;
  const entriesRef = ref(database, `users/${userId}/entries`);

  return onValue(entriesRef, (snapshot) => {
    const data = snapshot.val() as Record<string, JournalEntry> | null;
    const remoteEntries = data ? Object.values(data) : [];
    const localEntries = getLocalEntries(userId);
    const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
    const entriesToMigrate = localEntries.filter((entry) => !remoteIds.has(entry.id));
    const combinedEntries = [...remoteEntries, ...entriesToMigrate]
      .reduce((unique, entry) => unique.set(entry.id, entry), new Map<string, JournalEntry>());

    onEntries([...combinedEntries.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

    if (!migrationAttempted && entriesToMigrate.length > 0) {
      migrationAttempted = true;
      void Promise.all(entriesToMigrate.map((entry) => saveJournalEntry(userId, entry)))
        .catch((error: unknown) => onError(error instanceof Error ? error : new Error('Local entries could not be synced.')));
    } else {
      migrationAttempted = true;
    }
  }, (error) => {
    console.error('Realtime Database journal subscription failed:', error);
    onError(new Error(`Realtime Database error (${error.code}). Check the database URL and rules.`));
  });
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
 * Save multi-turn Gemini companion interaction under:
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

  if (database) {
    try {
      const interactionRef = ref(database, `users/${userId}/interactions/${interaction.id}`);
      await set(interactionRef, cleanPayload);
      return;
    } catch (err) {
      console.warn('Realtime Database interaction write failed, using local store:', err);
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

  if (database) {
    try {
      await remove(ref(database, `users/${userId}/entries/${entryId}`));
    } catch (err) {
      console.warn('Realtime Database delete error:', err);
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
  if (database) {
    await remove(ref(database, `users/${userId}`));
  }
  localStorage.removeItem(getLocalEntriesKey(userId));
  localStorage.removeItem(getLocalInteractionsKey(userId));
}
