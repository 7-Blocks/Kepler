import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { AuthShell } from '@/components/auth/AuthShell';
import { TextField, PasswordField } from '@/components/auth/fields';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Divider } from '@/components/auth/Divider';
import { signInSchema, type SignInValues } from '@/lib/validation';
import { login } from '@/services/auth';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

const REDIRECT_TO = '/dashboard';

const SignIn = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    handleGoogle,
    loading: googleLoading,
    isConfigured: googleConfigured,
    isReady: googleReady,
  } = useGoogleSignIn(REDIRECT_TO);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) navigate(REDIRECT_TO, { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: SignInValues) => {
    try {
      const session = await login(values);
      setSession(session);
      toast.success('Signed in successfully.');
      navigate(REDIRECT_TO, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'UNAUTHORIZED') {
          setError('password', { message: 'Incorrect email or password' });
        }
        toast.error(err.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const busy = isSubmitting || googleLoading;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Kepler account to access mission control."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-[#5EE7FF] no-underline hover:text-[#8FD9FF] transition-colors"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email?.message}
          disabled={busy}
          {...register('email')}
        />

        <div className="flex flex-col gap-1.5">
          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            icon={Lock}
            error={errors.password?.message}
            disabled={busy}
            {...register('password')}
          />
          <div className="flex justify-end">
            <a
              href="#forgot-password"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Password reset is coming soon.');
              }}
              className="font-body-ui text-[12.5px] text-[#94A3B8] hover:text-[#5EE7FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE7FF]/50 rounded"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <SubmitButton type="submit" loading={isSubmitting} loadingText="Signing in…" disabled={busy}>
          Sign In
        </SubmitButton>
      </form>

      <div className="my-6">
        <Divider />
      </div>

      <GoogleButton
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={busy || !googleConfigured || !googleReady}
      />
      {!googleConfigured && (
        <p className="mt-2 text-center font-body-ui text-[12px] text-[#64748B]">
          Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID to enable it.
        </p>
      )}
    </AuthShell>
  );
};

export default SignIn;
