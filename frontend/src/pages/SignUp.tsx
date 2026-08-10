import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { AuthShell } from '@/components/auth/AuthShell';
import { TextField, PasswordField } from '@/components/auth/fields';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Divider } from '@/components/auth/Divider';
import { signUpSchema, type SignUpValues } from '@/lib/validation';
import { register as registerUser } from '@/services/auth';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

const REDIRECT_TO = '/dashboard';

const SignUp = () => {
  const navigate = useNavigate();
  const {setSession, isAuthenticated} = useAuthStore()
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
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (isAuthenticated) navigate(REDIRECT_TO, { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: SignUpValues) => {
    try {
      const session = await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      setSession(session);
      toast.success('Account created. Welcome aboard!');
      navigate(REDIRECT_TO, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CONFLICT') {
          setError('email', { message: 'This email is already registered' });
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
      title="Create your account"
      subtitle="Join Kepler and start monitoring the orbital environment."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-medium text-[#5EE7FF] no-underline hover:text-[#8FD9FF] transition-colors"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <TextField
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          icon={User}
          error={errors.fullName?.message}
          disabled={busy}
          {...register('fullName')}
        />

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

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          icon={Lock}
          error={errors.password?.message}
          disabled={busy}
          {...register('password')}
        />

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          disabled={busy}
          {...register('confirmPassword')}
        />

        <SubmitButton type="submit" loading={isSubmitting} loadingText="Creating account…" disabled={busy}>
          Sign Up
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

export default SignUp;
