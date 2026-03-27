import { InputHTMLAttributes, memo, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon?: ReactNode;
};

function Input({ id, label, icon, className = "", ...props }: InputProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300/85 transition-colors duration-300 peer-focus-within:text-zinc-100">
        {icon}
      </div>
      <input
        id={id}
        placeholder=" "
        className={`peer h-14 w-full rounded-xl border border-white/28 bg-gradient-to-b from-white/20 via-zinc-100/10 to-white/12 px-11 pt-5 pb-2 text-sm text-zinc-50 outline-none transition duration-300 placeholder:text-transparent focus:border-zinc-100/75 focus:bg-white/24 focus:shadow-[0_0_0_1px_rgba(244,244,245,0.42),0_0_24px_rgba(255,255,255,0.12)] ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-11 top-2 text-xs text-zinc-200/80 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-zinc-50"
      >
        {label}
      </label>
    </div>
  );
}

export default memo(Input);
