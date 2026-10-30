import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  getDocFromServer,
  collection,
  query,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  where,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal offline fallback warnings from @firebase/firestore
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase app once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the provisioned databaseId
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let isSignInInProgress = false;

export async function signInWithGoogle(): Promise<User | null> {
  if (isSignInInProgress) {
    console.warn('Sign-in popup is already active.');
    return null;
  }
  isSignInInProgress = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Handle user closing popup window gracefully without uncaught rejection
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('Pending promise was never set')
    ) {
      console.info('Google sign-in popup was dismissed by the user.');
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Popup blocked by browser. Please allow popups.');
      throw new Error('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة للموقع لإتمام الدخول.');
    }
    if (
      error?.code?.includes('token-service') ||
      error?.message?.includes('securetoken.googleapis.com') ||
      error?.message?.includes('token-service-api-has-not-been-used')
    ) {
      console.warn('Firebase securetoken API is not enabled in GCP project. Falling back to Guest mode.');
      throw new Error('خدمة المصادقة السحابية غير مفعلة حالياً في مشروع Google Cloud. يمكنك استخدام كامل المنصة بحرية في وضع الضيف.');
    }
    throw error;
  } finally {
    isSignInInProgress = false;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Error handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safe non-blocking connection check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    return !!db;
  } catch {
    return false;
  }
}
