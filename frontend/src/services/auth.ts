/**
 * Authentication API — Kepler AI
 *
 * Thin wrapper around the FastAPI `/auth` endpoints. Every call resolves to a
 * normalised result or throws an `ApiError` carrying the backend's
 * human-readable message (safe to drop straight into a toast).
 */
import { ApiError, type ErrorResponse } from './api';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  is_active: boolean;
  role_id: number | null;
  organization_id: number | null;
  created_at: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserProfile | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile | null;
}

async function throwApiError(res: Response, fallbackPath: string): Promise<never> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body) {
    throw new ApiError(res.status, body as ErrorResponse);
  }
  throw new ApiError(res.status, {
    message: `Request to ${fallbackPath} failed (HTTP ${res.status} ${res.statusText}).`,
  });
}

function toSession(token: TokenResponse): AuthSession {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    user: token.user,
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  accessToken?: string;
  idToken?: string;
}

/** Exchange email + password for a token pair. */
export async function login({ email, password }: LoginInput): Promise<AuthSession> {
  // The `/token` endpoint uses OAuth2's password flow, which expects a
  // urlencoded form body with `username`/`password` fields.
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) await throwApiError(res, '/auth/token');
  return toSession(await res.json());
}

/** Create an account, then immediately sign the new operator in. */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
    }),
  });
  if (!res.ok) await throwApiError(res, '/auth/register');
  return login({ email: input.email, password: input.password });
}

/**
 * Sign in or transparently register with Google. Send whichever token Google
 * Identity Services produced; the backend verifies it before trusting anything.
 */
export async function googleAuth(input: GoogleAuthInput): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: input.accessToken,
      id_token: input.idToken,
    }),
  });
  if (!res.ok) await throwApiError(res, '/auth/google');
  return toSession(await res.json());
}
