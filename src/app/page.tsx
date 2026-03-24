"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { VapiButton } from "@/components/vapi-button";
import { ScrollReveal } from "@/components/scroll-reveal";

const VIDEO_URL =
  "https://cdn.leonardo.ai/users/1e6cc72e-a3f5-40e9-be20-154e1a1bf16c/generations/1f127b65-017b-6c60-88a5-e9f89dec576a/kling-3.0_Slow_cinematic_panning_shot_through_a_premium_modern_dog_grooming_salon._Warm_go-0.mp4";

const STRIPE_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!;

/* ── Bento feature data ── */
const bentoItems = [
  {
    label: "Instant Pickup",
    title: "Answers in under 2 seconds",
    description:
      "Your AI receptionist picks up every single call — no hold music, no voicemail, no missed revenue. Clients hear a warm, friendly voice immediately.",
    span: "md:col-span-2",
    accent: "bg-sage/10 border-sage/20",
  },
  {
    label: "Smart Context",
    title: "Knows your services & pricing",
    description:
      "Trained on your specific grooming menu. Answers questions about packages, add-ons, breed-specific pricing, and availability — like your best front-desk hire.",
    span: "md:col-span-1",
    accent: "bg-terracotta/10 border-terracotta/20",
  },
  {
    label: "SMS Summaries",
    title: "Texts you after every call",
    description:
      "Get an instant text with the caller's name, dog breed, requested service, and preferred appointment time. Follow up between dogs — no notepad needed.",
    span: "md:col-span-1",
    accent: "bg-terracotta/10 border-terracotta/20",
  },
  {
    label: "24/7 Availability",
    title: "Books appointments while you groom",
    description:
      "Early mornings, lunch breaks, after hours — your AI receptionist captures every lead and books them into your calendar. You just show up and groom.",
    span: "md:col-span-2",
    accent: "bg-sage/10 border-sage/20",
  },
];

/* ── Video Hero with scroll-scrub ── */
function VideoHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const videoOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.08]);

  /* Scrub video playback to scroll position */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const unsubscribe = scrollYProgress.on("change", (v) => {
      if (video.duration) {
        video.currentTime = v * video.duration;
      }
    });

    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[110vh] flex items-start overflow-hidden"
    >
      {/* Video layer */}
      <motion.div
        style={{ opacity: videoOpacity, scale: videoScale }}
        className="absolute inset-0 z-0"
      >
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        {/* Inward gradient mask: fades video edges into cream */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream/40 via-transparent to-cream" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream/70 via-transparent to-cream/30" />
      </motion.div>

      {/* Hero content — Editorial split layout */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-40 md:pt-44 md:pb-56 lg:px-10">
        {/* Top nav pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="mb-16 md:mb-24"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-warm-200 bg-cream/80 px-4 py-2 text-sm font-medium text-warm-600 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
            AI-Powered Voice Receptionist
          </span>
        </motion.div>

        <div className="grid gap-12 md:grid-cols-12 md:gap-8 items-end">
          {/* Left: massive typography */}
          <div className="md:col-span-7 lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 1.1,
                delay: 0.15,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="text-[clamp(2.8rem,6vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-warm-800"
            >
              Stop missing
              <br />
              calls.{" "}
              <span className="text-sage">
                Start
                <br className="hidden lg:block" /> grooming.
              </span>
            </motion.h1>
          </div>

          {/* Right: description + CTAs */}
          <div className="md:col-span-5 lg:col-span-5 flex flex-col gap-8">
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.35,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="text-lg leading-relaxed text-warm-500 md:text-xl"
            >
              GroomerBot is the AI receptionist that answers your phone 24/7,
              books appointments, and texts you every detail. Never lose a
              client to voicemail again.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.5,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <VapiButton />
              <a
                href={STRIPE_LINK}
                className="
                  group/cta relative inline-flex items-center gap-2
                  rounded-full border border-warm-200 bg-cream/60
                  px-7 py-4 text-base font-medium text-warm-700
                  backdrop-blur-sm
                  transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                  hover:border-sage/40 hover:bg-cream/90
                  hover:shadow-[0_4px_24px_-4px_rgba(124,140,110,0.15)]
                  active:scale-[0.98] active:-translate-y-[1px]
                "
              >
                Get Started &mdash; $49/mo
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
                >
                  <path
                    d="M1 13L13 1M13 1H5M13 1V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Social proof / trust strip ── */
function TrustStrip() {
  return (
    <ScrollReveal>
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-warm-400">
            Built for solo groomers who are tired of missing calls
          </p>
          <div className="mt-4 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-terracotta"
              >
                <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.28l-4.77 2.44.91-5.33L2.27 6.62l5.34-.78L10 1z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-warm-500">
              &ldquo;It paid for itself the first week.&rdquo;
            </span>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

/* ── Asymmetric Bento Grid ── */
function BentoGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
      <ScrollReveal>
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-sage">
            How it works
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-warm-800">
            Your best employee
            <br />
            never takes a day off.
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid gap-4 md:grid-cols-3">
        {bentoItems.map((item, i) => (
          <ScrollReveal
            key={item.title}
            className={item.span}
            delay={i * 0.1}
          >
            {/* Double-bezel card */}
            <div
              className={`
                group relative rounded-2xl border p-[1px]
                ${item.accent}
                transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                hover:shadow-[0_8px_60px_-12px_rgba(124,140,110,0.12)]
              `}
            >
              <div className="rounded-[calc(1rem-1px)] bg-cream p-8 md:p-10">
                <span className="mb-4 inline-block rounded-full border border-warm-200 bg-cream-dark px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-warm-500">
                  {item.label}
                </span>
                <h3 className="mb-3 text-xl font-semibold text-warm-800 md:text-2xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-warm-500">
                  {item.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ── Pricing CTA section ── */
function PricingCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-36">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-warm-200 bg-warm-800 p-[1px]">
          <div className="rounded-[calc(1.5rem-1px)] bg-warm-800 px-8 py-16 md:px-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-warm-400">
                Simple pricing
              </p>
              <h2 className="mb-6 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-cream">
                $49<span className="text-warm-500">/month</span>
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-warm-400">
                One missed call costs you $80+ in lost revenue. GroomerBot pays
                for itself after a single saved booking.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href={STRIPE_LINK}
                  className="
                    group/price relative inline-flex items-center gap-3
                    rounded-full bg-cream px-8 py-4 text-base font-medium text-warm-800
                    transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                    hover:shadow-[0_8px_40px_-8px_rgba(253,251,247,0.3)]
                    active:scale-[0.98] active:-translate-y-[1px]
                  "
                >
                  Start Your Free Trial
                  <span
                    className="
                      flex h-7 w-7 items-center justify-center
                      rounded-full bg-warm-800/10
                      transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                      group-hover/price:translate-x-0.5 group-hover/price:-translate-y-0.5
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
                </a>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-warm-500">
                <span>No contracts</span>
                <span className="text-warm-600">&middot;</span>
                <span>Cancel anytime</span>
                <span className="text-warm-600">&middot;</span>
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="border-t border-warm-200 px-6 py-12 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <span className="text-sm font-medium text-warm-700">GroomerBot</span>
        <span className="text-sm text-warm-400">
          &copy; {new Date().getFullYear()} GroomerBot. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

/* ── Page ── */
export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <VideoHero />
      <TrustStrip />
      <BentoGrid />
      <PricingCta />
      <Footer />
    </main>
  );
}
