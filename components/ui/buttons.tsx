import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
};

const base =
  "inline-flex min-h-[52px] max-w-full min-w-0 items-center justify-center rounded-[10px] px-4 text-base font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:px-7";

export function PrimaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} bg-primary text-white shadow-[0_4px_14px_rgba(27,107,58,0.3)] hover:bg-primary-dark sm:hover:scale-[1.02] ${fullWidth ? "w-full max-w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} border-2 border-primary bg-transparent text-primary hover:bg-primary-light ${fullWidth ? "w-full max-w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function UrgencyButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} bg-accent font-bold text-white shadow-[0_4px_14px_rgba(212,130,10,0.3)] hover:brightness-110 ${fullWidth ? "w-full max-w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
