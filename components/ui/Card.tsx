"use client";

import { motion } from "framer-motion";
import { memo, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hasError?: boolean;
};

function Card({ children, className = "", hasError = false }: CardProps) {
  return (
    <div className="group relative w-full">
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-zinc-500/20 via-zinc-400/15 to-zinc-600/20 opacity-90 blur-md transition duration-500 group-hover:opacity-100" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.01, y: -2 }}
        className={`relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-black/72 to-black/56 p-6 shadow-2xl backdrop-blur-2xl transition md:p-8 ${
          hasError ? "ring-1 ring-red-500/40" : ""
        } ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-black/50 blur-3xl" />
        {children}
      </motion.div>
    </div>
  );
}

export default memo(Card);
