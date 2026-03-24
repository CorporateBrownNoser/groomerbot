"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const { error: dbError } = await supabase.from("clients").insert({
      business_name: form.get("business_name") as string,
      owner_name: form.get("owner_name") as string,
      phone: form.get("phone") as string,
      email: form.get("email") as string,
      status: "active",
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
        className="w-full max-w-lg"
      >
        {/* Step indicator */}
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage text-xs font-semibold text-cream">
            1
          </span>
          <div className="h-[1px] flex-1 bg-warm-200" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-warm-200 text-xs font-medium text-warm-400">
            2
          </span>
          <div className="h-[1px] flex-1 bg-warm-200" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-warm-200 text-xs font-medium text-warm-400">
            3
          </span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-3 text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-tight text-warm-800">
            Welcome to GroomerBot
          </h1>
          <p className="text-base leading-relaxed text-warm-500">
            Tell us about your business so we can train your AI receptionist to
            sound like your best front-desk employee.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="business_name"
              className="text-sm font-medium text-warm-700"
            >
              Business Name
            </label>
            <input
              id="business_name"
              name="business_name"
              placeholder="Paws & Claws Grooming"
              required
              className={inputClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="owner_name"
              className="text-sm font-medium text-warm-700"
            >
              Owner Name
            </label>
            <input
              id="owner_name"
              name="owner_name"
              placeholder="Jane Smith"
              required
              className={inputClasses}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-warm-700"
              >
                Business Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                required
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-warm-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jane@pawsandclaws.com"
                required
                className={inputClasses}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="services"
              className="text-sm font-medium text-warm-700"
            >
              Services Offered &amp; Pricing
            </label>
            <textarea
              id="services"
              name="services"
              rows={5}
              placeholder={
                "Bath & Brush — $45\nFull Groom (small) — $65\nFull Groom (large) — $85\nNail Trim — $15"
              }
              className={`${inputClasses} resize-none`}
            />
            <p className="text-xs text-warm-400">
              List each service on a new line. This helps your AI answer pricing
              questions accurately.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
              {error}
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
                Setting up...
              </>
            ) : (
              <>
                Set Up My AI Receptionist
                <span
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-full bg-cream/10
                    transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                  "
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
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
      </motion.div>
    </main>
  );
}
