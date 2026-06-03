"use client";

import { motion } from "framer-motion";

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const pulseGlow = {
  opacity: [0.3, 0.6, 0.3],
  scale: [1, 1.08, 1],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const gearRotate = {
  rotate: 360,
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "linear",
  },
};

const gearRotateReverse = {
  rotate: -360,
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "linear",
  },
};

export default function MaintenancePage({ clubLogoUrl }: { clubLogoUrl?: string }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      {/* Pure white background */}
      <div className="absolute inset-0 bg-white" />

      {/* Subtle light gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-white to-zinc-100/50" />

      {/* Soft radial accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,200,220,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(200,200,220,0.1),transparent_50%)]" />

      {/* Floating blobs - light tones */}
      <div className="pointer-events-none absolute -left-20 top-1/4 size-72 rounded-full bg-zinc-200/30 blur-3xl blob-float" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 size-80 rounded-full bg-zinc-200/20 blur-3xl blob-float-delayed" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 size-64 rounded-full bg-zinc-100/40 blur-3xl blob-float-slow" />

      {/* Animated particles - subtle gray */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute size-1.5 rounded-full bg-zinc-300/60"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Club logo */}
        {clubLogoUrl && (
          <div className="relative mb-10 flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 72, height: 72 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clubLogoUrl}
                alt="Cloud Computing Club logo"
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-base font-semibold tracking-wide text-zinc-700 sm:text-lg">
              Cloud Computing Club
            </p>
          </div>
        )}

        {/* Gear icons */}
        <div className="mb-8 flex items-center gap-1">
          <motion.svg
            className="size-8 text-zinc-400 sm:size-10"
            animate={gearRotate}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </motion.svg>
          <motion.svg
            className="-ml-2 size-6 text-zinc-300 sm:size-7"
            animate={gearRotateReverse}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </motion.svg>
        </div>

        {/* Heading */}
        <motion.h1
          className="bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Under Maintenance
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          We&apos;re currently performing scheduled maintenance to improve your experience.
          We&apos;ll be back shortly.
        </motion.p>

        {/* Animated progress bar */}
        <motion.div
          className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-zinc-200 sm:w-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-400"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Club name */}
        <motion.p
          className="mt-10 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          Cloud Computing Club
        </motion.p>
      </motion.div>
    </div>
  );
}
