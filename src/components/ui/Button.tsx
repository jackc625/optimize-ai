// src/components/ui/Button.tsx

import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "font-medium rounded-[var(--radius)] transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variants = {
    primary: `
      bg-primary
      text-primary-foreground
      hover:bg-primary-600
      focus:ring-primary-300
      disabled:bg-muted
      disabled:text-muted-foreground
    `,
    outline: `
      border-border
      text-foreground
      hover:bg-muted
      focus:ring-primary-300
      disabled:border-muted
      disabled:text-muted-foreground
    `,
    ghost: `
      text-foreground
      hover:bg-muted
      focus:ring-primary-300
      disabled:text-muted-foreground
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${base}
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
