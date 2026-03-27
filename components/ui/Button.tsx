"use client";

import { ButtonHTMLAttributes, memo, ReactNode } from "react";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
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
    <button
      type="button"
      disabled={isDisabled}
      className={`relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-b from-zinc-700 to-zinc-900 px-4 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          Verifying...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default memo(Button);
