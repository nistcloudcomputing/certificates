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
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-white/24 via-zinc-100/18 to-white/22 opacity-85 blur-md transition duration-500 group-hover:opacity-100" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.01, y: -2 }}
        className={`relative overflow-hidden rounded-3xl border border-white/28 bg-gradient-to-b from-white/24 via-zinc-200/12 to-white/14 p-5 shadow-2xl backdrop-blur-2xl transition sm:p-6 md:p-8 ${
          hasError ? "ring-1 ring-red-500/40" : ""
        } ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/18 to-transparent" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-white/14 blur-3xl" />
        {children}
      </motion.div>
    </div>
  );
}

export default memo(Card);
