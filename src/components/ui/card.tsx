import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        bg-card
        dark:bg-card-foreground
        rounded-[var(--radius)]
        border-border
        shadow-md
        ${className}
      `}
    >
      {children}
    </div>
  );
}

type CardSectionProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = "" }: CardSectionProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-b border-border
        dark:border-neutral-700
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardSectionProps) {
  return <div className={`px-6 py-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardSectionProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-t border-border
        dark:border-neutral-700
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardSectionProps) {
  return (
    <h2
      className={`text-xl font-semibold text-foreground dark:text-background ${className}`}
    >
      {children}
    </h2>
  );
}
