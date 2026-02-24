"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/signin");
        return;
      }

      if (response.status === 409) {
        setError("An account with that email already exists.");
      } else {
        setError("Unable to create account. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">Sign Up</h1>
          <p className="text-sm text-neutral-500">Create your account.</p>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700" htmlFor="confirm-password">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-xs text-neutral-500 text-center">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#4F46E5] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
