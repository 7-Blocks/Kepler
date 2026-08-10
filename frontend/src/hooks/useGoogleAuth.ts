/**
 * useGoogleAuth — Google Identity Services (GIS) integration.
 *
 * Loads the official GIS script once, then exposes a promise-based `signIn`
 * that runs the OAuth 2.0 token flow and resolves with an access token. The
 * token is sent to our backend (`/auth/google`), which verifies it with Google
 * before creating or signing in the user. Using our own trigger (instead of
 * Google's pre-styled button) lets the "Continue with Google" control match the
 * app's design while remaining fully functional and production-ready.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = 'google-identity-services';

const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  callback: (resp: TokenResponse) => void;
  error_callback?: (err: { type?: string; message?: string }) => void;
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export class GoogleAuthError extends Error {}

let scriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }
    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google script'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useGoogleAuth() {
  const isConfigured = Boolean(CLIENT_ID);
  const [isReady, setIsReady] = useState(false);
  const tokenClientRef = useRef<TokenClient | null>(null);

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isConfigured]);

  const signIn = useCallback((): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (!isConfigured || !CLIENT_ID) {
        reject(new GoogleAuthError('Google sign-in is not configured.'));
        return;
      }
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) {
        reject(new GoogleAuthError('Google sign-in is still loading. Please try again.'));
        return;
      }

      if (!tokenClientRef.current) {
        tokenClientRef.current = oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'openid email profile',
          callback: () => {},
        });
      }

      const client = tokenClientRef.current;
      client.callback = (resp: TokenResponse) => {
        if (resp.error) {
          reject(new GoogleAuthError(resp.error_description || 'Google sign-in failed.'));
          return;
        }
        if (!resp.access_token) {
          reject(new GoogleAuthError('Google did not return an access token.'));
          return;
        }
        resolve(resp.access_token);
      };
      client.error_callback = (err) => {
        // Popup closed / blocked / user cancelled.
        reject(new GoogleAuthError(err?.message || 'Google sign-in was cancelled.'));
      };

      try {
        client.requestAccessToken();
      } catch {
        reject(new GoogleAuthError('Could not open the Google sign-in window.'));
      }
    });
  }, [isConfigured]);

  return { signIn, isReady, isConfigured };
}
