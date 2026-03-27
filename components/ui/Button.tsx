"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { memo, ReactNode } from "react";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  loading?: boolean;
};

function Button({
  children,
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      whileHover={isDisabled ? undefined : { scale: 1.02, filter: "brightness(1.1)" }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 340, damping: 24, mass: 0.7 }}
      disabled={isDisabled}
      className={`group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-b from-zinc-700 to-zinc-900 px-4 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/50 transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/10 blur-xl transition duration-700 group-hover:left-[120%]" />
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          Verifying...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

export default memo(Button);
