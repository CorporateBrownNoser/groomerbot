"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";

interface Client {
  id: string;
  business_name: string;
  owner_name: string;
  vapi_phone_number: string | null;
  subscription_status: string;
}

interface CallLog {
  id: string;
  caller_name: string;
  caller_phone: string;
  dog_name: string;
  summary: string;
  duration_seconds: number;
  created_at: string;
}

interface Appointment {
  id: string;
  customer_name: string;
  dog_name: string;
  service_type: string;
  requested_date: string;
  status: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 30, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: {
    duration: 0.8,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
  },
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [client, setClient] = useState<Client | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch client profile
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (clientData) {
        setClient(clientData);
      }

      // Fetch call logs for this client
      const { data: callsData } = await supabase
        .from("call_logs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (callsData) setCalls(callsData);

      // Fetch pending appointments
      const { data: aptsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", user.id)
        .eq("status", "pending")
        .order("requested_date", { ascending: true })
        .limit(20);

      if (aptsData) setAppointments(aptsData);

      setLoading(false);
    }

    load();
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-warm-300 border-t-sage" />
          <p className="text-sm text-warm-400">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // No client record yet — prompt to onboard
  if (!client) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="max-w-md text-center">
          <h1 className="mb-3 text-2xl font-bold text-warm-800">
            Complete Your Setup
          </h1>
          <p className="mb-6 text-warm-500">
            You haven&apos;t set up your AI receptionist yet. Complete the
            onboarding to get started.
          </p>
          <button
            onClick={() => router.push("/welcome")}
            className="
              group inline-flex items-center gap-3 rounded-full bg-warm-800
              px-8 py-4 text-base font-medium text-cream
              transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
              hover:shadow-[0_8px_40px_-8px_rgba(44,41,38,0.2)]
              active:scale-[0.98]
            "
          >
            Go to Onboarding
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
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header with sign out */}
        <motion.div {...fadeUp} className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-warm-400">
              {client.business_name}
            </p>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-warm-800">
              Dashboard
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-warm-200 px-4 py-2 text-sm text-warm-500 transition-all duration-300 hover:border-warm-300 hover:text-warm-700"
          >
            Sign Out
          </button>
        </motion.div>

        {/* Phone number banner */}
        {client.vapi_phone_number ? (
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="mb-8 rounded-2xl border border-sage/20 bg-sage/5 p-6 md:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-sage">
                  Your AI Receptionist Number
                </p>
                <p className="text-2xl font-bold tracking-tight text-sage-dark md:text-3xl">
                  {client.vapi_phone_number}
                </p>
              </div>
              <div className="text-sm text-sage">
                <p className="font-medium">Forward your business calls here</p>
                <p className="text-sage/70">
                  Your AI answers 24/7 and texts you a summary
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="mb-8 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-6"
          >
            <p className="text-sm font-medium text-terracotta">
              Your AI receptionist is being set up. Refresh the page in a moment
              to see your phone number.
            </p>
          </motion.div>
        )}

        {/* Stat cards */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="mb-12 grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Total Calls",
              value: calls.length,
              accent: "text-sage",
            },
            {
              label: "Pending Bookings",
              value: appointments.length,
              accent: "text-terracotta",
            },
            {
              label: "Avg Duration",
              value:
                calls.length > 0
                  ? `${Math.round(
                      calls.reduce((a, c) => a + c.duration_seconds, 0) /
                        calls.length
                    )}s`
                  : "—",
              accent: "text-warm-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-warm-200 bg-cream p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_4px_32px_-8px_rgba(124,140,110,0.08)]"
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-warm-400">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${stat.accent}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Recent Calls */}
        <motion.section
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="mb-12"
        >
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-warm-800">
              Recent Calls
            </h2>
            <span className="text-xs text-warm-400">{calls.length} total</span>
          </div>

          {calls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-warm-200 bg-cream-dark/50 px-8 py-16 text-center">
              <p className="mb-1 text-sm font-medium text-warm-600">
                No calls yet
              </p>
              <p className="text-sm text-warm-400">
                Once your AI receptionist starts taking calls, they&apos;ll
                stream in here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-warm-200">
              <div className="divide-y divide-warm-100">
                {calls.map((call, i) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.05 * i,
                      ease: [0.32, 0.72, 0, 1] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }}
                    className="flex items-start gap-4 bg-cream px-6 py-5 transition-colors duration-300 hover:bg-cream-dark/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sm font-semibold text-sage">
                      {(call.caller_name || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-warm-800">
                          {call.caller_name || "Unknown"}
                        </span>
                        {call.dog_name && (
                          <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs text-warm-500">
                            {call.dog_name}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-warm-500">
                        {call.summary || "No summary"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-warm-400">
                        {Math.round(call.duration_seconds / 60)}m{" "}
                        {call.duration_seconds % 60}s
                      </p>
                      <p className="mt-0.5 text-xs text-warm-300">
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Pending Appointments */}
        <motion.section
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
        >
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-warm-800">
              Pending Appointments
            </h2>
            <span className="text-xs text-warm-400">
              {appointments.length} pending
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-warm-200 bg-cream-dark/50 px-8 py-16 text-center">
              <p className="mb-1 text-sm font-medium text-warm-600">
                No pending appointments
              </p>
              <p className="text-sm text-warm-400">
                New booking requests from callers will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-warm-200">
              <div className="divide-y divide-warm-100">
                {appointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.05 * i,
                      ease: [0.32, 0.72, 0, 1] as [
                        number,
                        number,
                        number,
                        number,
                      ],
                    }}
                    className="flex items-center gap-4 bg-cream px-6 py-5 transition-colors duration-300 hover:bg-cream-dark/40"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-terracotta/10 text-center">
                      {apt.requested_date ? (
                        <>
                          <span className="text-xs font-medium leading-none text-terracotta">
                            {new Date(apt.requested_date).toLocaleDateString(
                              "en-US",
                              { month: "short" }
                            )}
                          </span>
                          <span className="text-lg font-bold leading-tight text-terracotta">
                            {new Date(apt.requested_date).getDate()}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-terracotta">
                          TBD
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-warm-800">
                          {apt.customer_name || "Unknown"}
                        </span>
                        {apt.dog_name && (
                          <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs text-warm-500">
                            {apt.dog_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-warm-500">
                        {apt.service_type || "Service not specified"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-terracotta/20 bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta">
                      {apt.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
