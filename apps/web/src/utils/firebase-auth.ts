import { isCapacitor, isIOS } from '@/utils/capacitor';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp } from 'firebase/app';
import {
  type Auth,
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInWithPopup,
} from 'firebase/auth';

/** Apple is offered in the iOS app, where App Store rules require it */
export type OAuthProviderId = 'google' | 'apple';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

function getFirebaseWebConfig(): FirebaseWebConfig {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
    string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as
    string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error('Firebase web config is missing (VITE_FIREBASE_*)');
  }

  return { apiKey, authDomain, projectId, appId };
}

/** The app was built with the Firebase settings Google sign-in needs. */
export function isFirebaseWebConfigured(): boolean {
  try {
    getFirebaseWebConfig();
    return true;
  } catch {
    return false;
  }
}

let webAuth: Auth | null = null;

function getWebAuth(): Auth {
  if (webAuth) return webAuth;

  const config = getFirebaseWebConfig();
  const app = initializeApp(config);
  webAuth = getAuth(app);
  return webAuth;
}

export async function getFirebaseIdTokenForProvider(
  providerId: OAuthProviderId,
): Promise<string> {
  if (isCapacitor()) {
    if (providerId === 'apple') {
      await FirebaseAuthentication.signInWithApple();
    } else {
      await FirebaseAuthentication.signInWithGoogle();
    }

    const { token } = await FirebaseAuthentication.getIdToken({
      forceRefresh: false,
    });
    return token;
  }

  const auth = getWebAuth();
  const provider =
    providerId === 'apple'
      ? new OAuthProvider('apple.com')
      : new GoogleAuthProvider();
  if (provider instanceof OAuthProvider) {
    provider.addScope('email');
    provider.addScope('name');
  }
  const { user } = await signInWithPopup(auth, provider);
  return await user.getIdToken();
}

/**
 * Apple asks apps to revoke Sign in with Apple when the account is deleted,
 * so the user no longer sees OpenAthlete in their Apple ID settings. Revoking
 * needs a fresh authorization code, hence one more Apple prompt. Best effort:
 * the account is already gone when this runs.
 */
export async function revokeAppleSignIn(): Promise<void> {
  if (!isIOS()) return;
  const { user } = await FirebaseAuthentication.getCurrentUser();
  const usesApple = user?.providerData.some(
    (info) => info.providerId === 'apple.com',
  );
  if (!usesApple) return;

  const { credential } = await FirebaseAuthentication.signInWithApple();
  if (credential?.authorizationCode) {
    await FirebaseAuthentication.revokeAccessToken({
      token: credential.authorizationCode,
    });
  }
}

export async function signOutFirebase(): Promise<void> {
  if (isCapacitor()) {
    await FirebaseAuthentication.signOut();
    return;
  }

  // Only sign out if Firebase was initialized on web.
  if (!webAuth) return;
  await webAuth.signOut();
}
