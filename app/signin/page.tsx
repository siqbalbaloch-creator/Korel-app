"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Default to the role-aware redirect so admins land on /admin and users on /new.
  // When an explicit callbackUrl is present (e.g. set by a protected route), it is respected.
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/auth/role-redirect";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-neutral-900">Sign In</h1>
        <p className="text-sm text-neutral-500">Access your Korel workspace.</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full rounded-md border border-neutral-200 bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
      >
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200" />
        <span>or</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          required
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[#4F46E5] py-2 text-sm font-medium text-white hover:bg-[#4338CA] disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-xs text-neutral-500 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#4F46E5] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
