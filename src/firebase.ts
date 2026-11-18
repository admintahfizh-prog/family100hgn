import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

function envOrDefault(envVal: unknown, fallback: string): string {
  return typeof envVal === 'string' && envVal.trim() ? envVal.trim() : fallback;
}

export const firebaseConfig = {
  apiKey: envOrDefault(import.meta.env.VITE_FIREBASE_API_KEY, defaultFirebaseConfig.apiKey),
  authDomain: envOrDefault(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, defaultFirebaseConfig.authDomain),
  projectId: envOrDefault(import.meta.env.VITE_FIREBASE_PROJECT_ID, defaultFirebaseConfig.projectId),
  storageBucket: envOrDefault(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, defaultFirebaseConfig.storageBucket),
  messagingSenderId: envOrDefault(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    defaultFirebaseConfig.messagingSenderId
  ),
  appId: envOrDefault(import.meta.env.VITE_FIREBASE_APP_ID, defaultFirebaseConfig.appId),
  firestoreDatabaseId: envOrDefault(
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    defaultFirebaseConfig.firestoreDatabaseId
  ),
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initDb() {
  try {
    return initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
): never {
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

async function verifyRestEndpoint(): Promise<'reachable' | 'bad_config' | 'network_blocked'> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseConfig.projectId
    )}/databases/${encodeURIComponent(
      firebaseConfig.firestoreDatabaseId
    )}/documents/test/connection?key=${encodeURIComponent(firebaseConfig.apiKey)}`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller?.signal,
      });
      if (res.status === 404) {
        const text = await res.text().catch(() => '');
        if (
          text.includes('does not exist') ||
          text.includes('NOT_FOUND') ||
          text.includes('Project')
        ) {
          return 'bad_config';
        }
      }
      return 'reachable';
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  } catch {
    return 'network_blocked';
  }
}

async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      const probe = await verifyRestEndpoint();
      if (probe === 'bad_config') {
        console.error('Please check your Firebase configuration.');
      } else if (probe === 'network_blocked') {
        console.warn(
          'Koneksi ke Firestore sedang terblokir atau offline. Pastikan internet aktif dan tidak diblokir firewall/adblocker.'
        );
      }
    }
  }
}

void testConnection();
