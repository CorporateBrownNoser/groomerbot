"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-cream">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-warm-300 border-t-sage" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = getSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage(
          "Check your email for a confirmation link, then come back to sign in."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }
    setLoading(false);
  }

  const inputClasses = `
    w-full rounded-xl border border-warm-200 bg-cream px-4 py-3.5
    text-warm-800 placeholder:text-warm-300
    transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
    focus:border-sage/50 focus:outline-none focus:ring-2 focus:ring-sage/20
    hover:border-warm-300
  `;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo / brand */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-warm-800">
            GroomerBot
          </h1>
          <p className="text-sm text-warm-400">
            {mode === "login"
              ? "Sign in to your dashboard"
              : "Create your account to get started"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="mb-8 flex rounded-xl border border-warm-200 bg-cream-dark/50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              mode === "login"
                ? "bg-cream text-warm-800 shadow-sm"
                : "text-warm-400 hover:text-warm-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              mode === "signup"
                ? "bg-cream text-warm-800 shadow-sm"
                : "text-warm-400 hover:text-warm-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-warm-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-warm-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={inputClasses}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-sage/20 bg-sage/5 px-4 py-3 text-sm text-sage-dark">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              group relative mt-2 inline-flex items-center justify-center gap-3
              rounded-full bg-warm-800 px-8 py-4 text-base font-medium text-cream
              transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
              hover:shadow-[0_8px_40px_-8px_rgba(44,41,38,0.2)]
              active:scale-[0.98] active:-translate-y-[1px]
              disabled:opacity-60 disabled:pointer-events-none
            "
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Create Account"}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M1 13L13 1M13 1H5M13 1V9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-warm-400">
          By continuing, you agree to GroomerBot&apos;s Terms of Service.
        </p>
      </motion.div>
    </main>
  );
}
