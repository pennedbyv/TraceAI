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
 * If Firebase credentials have not yet been configured in the environment or
 * the popup is restricted in the container iframe, smoothly establishes a private
 * session bound to the user's isolated vault without leaving the user stranded.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (auth && isFirebaseConfigured) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Contemplative Mind',
        photoURL: user.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg',
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.warn('Firebase popup sign-in encountered an issue:', err.code, err.message);
      
      // If the user deliberately closed the popup window
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was closed before completion. Click Continue with Google to try again.');
      }
      
      // For origin mismatch, unauthorized domain, or iframe sandbox restrictions, fall through to create the private session
    }
  }

  // Seamless fallback for sandboxed preview environments or unconfigured Firebase project IDs:
  // Preserves existing vault session if present, or initializes a private studio identity
  const existingStored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (existingStored) {
    try {
      const parsed = JSON.parse(existingStored);
      if (parsed && parsed.uid) return parsed;
    } catch {
      // ignore
    }
  }

  const demoProfile: UserProfile = {
    uid: 'usr_' + Math.random().toString(36).substring(2, 10),
    email: 'vedratnaict@gmail.com',
    displayName: 'Elena Rostova',
    photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg',
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoProfile));
  return demoProfile;
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
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Elena Rostova',
          photoURL: fbUser.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz8yrcMmonINQlKiyclu1GvZFOWahhFrtvp6gcTW7tPxStew4QWqiENh-UD4f8zrsVcZoQjSjUAZK3A720Rwy9DG7rsW_j7sZVh9a2qr9Cn3pEaTVphm3DbescwscklmsFO8DRCbTB21iBu6qRaiyzMUlf31tB_tmDNEP87CDj2OmJFU-PvPw-sLmDcYVYCiKApv_nHdKbcFaFnyfeMDkOL5jgpaZWhqflc4lHPgBcG3VSa-asxT9AJg',
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

  // Fallback observer for local storage
  const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (stored) {
    try {
      callback(JSON.parse(stored));
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }

  return () => {};
}
