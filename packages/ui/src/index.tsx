import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Button({ className, children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center border border-emerald-950 bg-emerald-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ children, tone = "verified" }: PropsWithChildren<{ tone?: "verified" | "planned" | "warning" }>) {
  const tones = {
    verified: "bg-emerald-100 text-emerald-900",
    planned: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-900"
  };
  return <span className={clsx("inline-flex px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}
