"use client";

import { memo, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hasError?: boolean;
};

function Card({ children, className = "", hasError = false }: CardProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-zinc-500/18 via-zinc-300/12 to-zinc-600/18 opacity-90 blur-md" />
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/18 bg-gradient-to-b from-black/72 via-black/62 to-black/54 p-5 shadow-2xl backdrop-blur-2xl sm:p-6 md:p-8 ${
          hasError ? "ring-1 ring-red-500/40" : ""
        } ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-44 w-44 rounded-full bg-black/45 blur-3xl" />
        {children}
      </div>
    </div>
  );
}

export default memo(Card);
