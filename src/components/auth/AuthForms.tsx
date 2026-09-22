"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset, updatePassword, signInWithGoogle, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : children}
    </button>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="btn-secondary w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M21.35 11.1H12v2.9h5.4c-.5 2.4-2.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.5 0 2.8.5 3.8 1.4l2.1-2.1C16.4 3.6 14.3 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.4 0-.7-.1-1.1z" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, initialError ? { error: initialError } : undefined);
  return (
    <div className="space-y-4">
      <GoogleButton next={next} />
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-ivory-500">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="input" />
        </div>
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        <SubmitButton pending={pending}>Sign in</SubmitButton>
        <p className="text-center text-sm text-ivory-400">
          <Link href="/auth/forgot" className="hover:text-ivory-100">Forgot your password?</Link>
        </p>
      </form>
    </div>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);
  return (
    <div className="space-y-4">
      <GoogleButton next={next} />
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-ivory-500">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" autoComplete="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </div>
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        {state?.message && <Alert kind="success">{state.message}</Alert>}
        <SubmitButton pending={pending}>Create account</SubmitButton>
        <p className="text-center text-xs text-ivory-500">
          By continuing you agree to our <Link href="/terms" className="underline hover:text-ivory-200">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-ivory-200">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.message && <Alert kind="success">{state.message}</Alert>}
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
