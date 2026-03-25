"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState("");
  const [provisionedPhone, setProvisionedPhone] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
      }
    });
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!userId) {
      setError("You must be signed in to complete onboarding.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);

    const clientData = {
      id: userId,
      business_name: form.get("business_name") as string,
      owner_name: form.get("owner_name") as string,
      phone: form.get("phone") as string,
      email: userEmail || (form.get("email") as string),
      services_pricing: form.get("services") as string,
      subscription_status: "active",
    };

    // Upsert client record (insert or update if already exists from Stripe webhook)
    const { error: dbError } = await supabase.from("clients").upsert(clientData, {
      onConflict: "id",
    });

    if (dbError) {
      console.error("[Onboarding] DB error:", dbError);
      setError(dbError.message);
      setLoading(false);
      return;
    }

    console.log("[Onboarding] Client record saved, starting Vapi provisioning...");
    setLoading(false);
    setProvisioning(true);

    // Trigger Vapi auto-provisioning
    try {
      const res = await fetch("/api/vapi/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Provisioning failed");
      }

      console.log("[Onboarding] Provisioning complete:", data);
      setProvisionedPhone(data.phoneNumber);

      // Wait a moment to show the success state, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 4000);
    } catch (provError) {
      console.error("[Onboarding] Provisioning error:", provError);
      // Still redirect — they can see status on dashboard
      setError(
        provError instanceof Error
          ? provError.message
          : "AI receptionist setup encountered an issue. You can retry from the dashboard."
      );
      setProvisioning(false);
      // Redirect to dashboard anyway after a delay
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  }

  const inputClasses = `
    w-full rounded-xl border border-warm-200 bg-cream px-4 py-3.5
    text-warm-800 placeholder:text-warm-300
    transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
    focus:border-sage/50 focus:outline-none focus:ring-2 focus:ring-sage/20
    hover:border-warm-300
  `;

  // Provisioning success screen
  if (provisionedPhone) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-lg text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage/10">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-sage"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-warm-800">
            Your AI Receptionist is Live!
          </h1>
          <p className="mb-8 text-lg text-warm-500">
            Forward your business calls to this number and we&apos;ll handle the
            rest.
          </p>
          <div className="mx-auto mb-6 rounded-2xl border border-sage/20 bg-sage/5 px-8 py-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-sage">
              Your GroomerBot Number
            </p>
            <p className="text-3xl font-bold tracking-tight text-sage-dark">
              {provisionedPhone}
            </p>
          </div>
          <p className="text-sm text-warm-400">
            Redirecting to your dashboard...
          </p>
        </motion.div>
      </main>
    );
  }

  // Provisioning in progress
  if (provisioning) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-warm-300 border-t-sage" />
          <h2 className="text-xl font-semibold text-warm-800">
            Setting up your AI receptionist...
          </h2>
          <p className="max-w-sm text-sm text-warm-400">
            We&apos;re creating a custom voice assistant trained on your services
            and provisioning a phone number. This takes about 10 seconds.
          </p>
        </motion.div>
      </main>
    );
  }

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
                defaultValue={userEmail}
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
              required
              className={`${inputClasses} resize-none`}
            />
            <p className="text-xs text-warm-400">
              List each service on a new line. This is what your AI receptionist
              will quote to callers — be specific!
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

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
                Saving...
              </>
            ) : (
              <>
                Set Up My AI Receptionist
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
      </motion.div>
    </main>
  );
}
