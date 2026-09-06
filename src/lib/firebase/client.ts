import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { UserProfile } from '../../types';

// Read client-side environment variables safely
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    firestore = getFirestore(app);
  } catch (err) {
    console.warn('Failed to initialize Firebase with provided credentials:', err);
  }
}

export { auth, firestore };

const LOCAL_STORAGE_USER_KEY = 'trace_authenticated_user_session';

/**
 * Sign in with Google using Firebase Authentication.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Google authentication is not configured. Add the VITE_FIREBASE_* values to .env and restart the app.');
  }

  try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'consent select_account' });
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Contemplative Mind',
        photoURL: user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg',
        googleAccessToken: credential?.accessToken || undefined,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.warn('Firebase popup sign-in encountered an issue:', err.code, err.message);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was closed before completion. Click Continue with Google to try again.');
    }
    throw new Error(err.message || 'Google sign-in failed. Check Firebase Authorized Domains and Google provider settings.');
  }
}

export async function reconnectGoogleCalendar(): Promise<string> {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Google authentication is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'consent select_account' });
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Google did not return a Calendar access token.');
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (stored) {
    try {
      const profile = JSON.parse(stored) as UserProfile;
      localStorage.setItem(
        LOCAL_STORAGE_USER_KEY,
        JSON.stringify({ ...profile, uid: result.user.uid, googleAccessToken: credential.accessToken })
      );
    } catch {
      // The returned token is still usable for the current calendar request.
    }
  }

  return credential.accessToken;
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}

export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): () => void {
  if (auth) {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        let storedProfile: UserProfile | null = null;
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (stored) {
          try {
            storedProfile = JSON.parse(stored) as UserProfile;
          } catch {
            storedProfile = null;
          }
        }
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Elena Rostova',
          photoURL: fbUser.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg',
          googleAccessToken: storedProfile?.uid === fbUser.uid ? storedProfile.googleAccessToken : undefined,
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        callback(profile);
      } else {
        // Check if there is a local session stored
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (stored) {
          try {
            callback(JSON.parse(stored));
            return;
          } catch {
            // ignore
          }
        }
        callback(null);
      }
    });
    return unsubscribe;
  }

  // Do not restore a fake local session when Firebase is unavailable.
  callback(null);
  return () => {};
}
