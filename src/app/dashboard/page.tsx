"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

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

export default function DashboardPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [callsRes, aptsRes] = await Promise.all([
        supabase
          .from("call_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("appointments")
          .select("*")
          .eq("status", "pending")
          .order("requested_date", { ascending: true })
          .limit(20),
      ]);

      if (callsRes.data) setCalls(callsRes.data);
      if (aptsRes.data) setAppointments(aptsRes.data);
      setLoading(false);
    }

    load();
  }, []);

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

  return (
    <main className="min-h-screen bg-cream px-6 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div {...fadeUp} className="mb-12 md:mb-16">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-warm-400">
            Overview
          </p>
          <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-warm-800">
            Dashboard
          </h1>
        </motion.div>

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
                  ? `${Math.round(calls.reduce((a, c) => a + c.duration_seconds, 0) / calls.length)}s`
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
            <span className="text-xs text-warm-400">
              {calls.length} total
            </span>
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
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    className="flex items-start gap-4 bg-cream px-6 py-5 transition-colors duration-300 hover:bg-cream-dark/40"
                  >
                    {/* Avatar circle */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sm font-semibold text-sage">
                      {call.caller_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-warm-800">
                          {call.caller_name}
                        </span>
                        {call.dog_name && (
                          <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs text-warm-500">
                            {call.dog_name}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-warm-500">
                        {call.summary}
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
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    className="flex items-center gap-4 bg-cream px-6 py-5 transition-colors duration-300 hover:bg-cream-dark/40"
                  >
                    {/* Date badge */}
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-terracotta/10 text-center">
                      <span className="text-xs font-medium leading-none text-terracotta">
                        {new Date(apt.requested_date).toLocaleDateString(
                          "en-US",
                          { month: "short" }
                        )}
                      </span>
                      <span className="text-lg font-bold leading-tight text-terracotta">
                        {new Date(apt.requested_date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-warm-800">
                          {apt.customer_name}
                        </span>
                        <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-xs text-warm-500">
                          {apt.dog_name}
                        </span>
                      </div>
                      <p className="text-sm text-warm-500">
                        {apt.service_type}
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
