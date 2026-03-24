"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!;
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;

export function VapiButton() {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "active">(
    "idle"
  );

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus("active"));
    vapi.on("call-end", () => setStatus("idle"));

    return () => {
      vapi.stop();
    };
  }, []);

  const toggle = async () => {
    if (!vapiRef.current) return;

    if (status === "active") {
      vapiRef.current.stop();
      setStatus("idle");
    } else {
      setStatus("connecting");
      await vapiRef.current.start(VAPI_ASSISTANT_ID);
    }
  };

  const isActive = status === "active";
  const isConnecting = status === "connecting";

  return (
    <button
      onClick={toggle}
      disabled={isConnecting}
      className={`
        group relative inline-flex items-center gap-3
        rounded-full px-8 py-4 text-base font-medium
        transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
        active:scale-[0.98] active:-translate-y-[1px]
        disabled:opacity-60 disabled:pointer-events-none
        ${
          isActive
            ? "bg-warm-800 text-cream shadow-[0_0_0_1px_rgba(196,121,91,0.4),0_8px_40px_-8px_rgba(196,121,91,0.3)]"
            : "bg-warm-800 text-cream shadow-[0_0_0_1px_rgba(44,41,38,0.1),0_8px_40px_-8px_rgba(44,41,38,0.15)] hover:shadow-[0_0_0_1px_rgba(124,140,110,0.4),0_12px_48px_-8px_rgba(124,140,110,0.2)]"
        }
      `}
    >
      {/* Pulse ring when active */}
      {isActive && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-terracotta" />
      )}

      {/* Live indicator dot */}
      {isActive && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta" />
        </span>
      )}

      <span className="relative z-10">
        {isActive
          ? "End Call"
          : isConnecting
            ? "Connecting..."
            : "Try a Live Demo"}
      </span>

      {/* Magnetic trailing icon */}
      {!isActive && !isConnecting && (
        <span
          className="
            relative z-10 flex h-8 w-8 items-center justify-center
            rounded-full bg-cream/10
            transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            group-hover:translate-x-0.5 group-hover:-translate-y-0.5
          "
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
      )}
    </button>
  );
}
