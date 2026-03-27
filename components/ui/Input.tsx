import { InputHTMLAttributes, memo, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon?: ReactNode;
};

function Input({ id, label, icon, className = "", ...props }: InputProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 peer-focus-within:text-zinc-200">
        {icon}
      </div>
      <input
        id={id}
        placeholder=" "
        className={`peer h-14 w-full rounded-xl border border-white/15 bg-gradient-to-b from-zinc-900/90 to-black/85 px-12 pt-5 pb-2 text-sm text-zinc-100 outline-none transition duration-300 placeholder:text-transparent focus:border-zinc-300/65 focus:bg-zinc-900/95 focus:shadow-[0_0_0_1px_rgba(228,228,231,0.32),0_0_26px_rgba(0,0,0,0.55)] ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-12 top-2 text-xs text-zinc-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-zinc-200"
      >
        {label}
      </label>
    </div>
  );
}

export default memo(Input);
