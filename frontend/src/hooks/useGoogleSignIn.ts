import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleAuth, GoogleAuthError } from '@/hooks/useGoogleAuth';
import { useAuthStore } from '@/store/authStore';
import { googleAuth } from '@/services/auth';
import { ApiError } from '@/services/api';

/**
 * Runs the full "Continue with Google" flow: obtain a Google token, exchange it
 * with the backend, persist the session, and redirect. Shared by Sign In and
 * Sign Up since Google auth is identical for both (first-time users are created
 * automatically, returning users are signed in).
 */
export function useGoogleSignIn(redirectTo = '/dashboard') {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const { signIn, isConfigured, isReady } = useGoogleAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const accessToken = await signIn();
      const session = await googleAuth({ accessToken });
      setSession(session);
      toast.success(
        `Welcome, ${session.user?.full_name || session.user?.email || 'operator'}!`
      );
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        // User cancelled or the popup was blocked — keep it low-key.
        if (!/cancel/i.test(err.message)) toast.error(err.message);
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, signIn, setSession, navigate, redirectTo]);

  return { handleGoogle, loading, isConfigured, isReady };
}
