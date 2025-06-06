// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Optimize AI",
  description: "Your personal self-improvement hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
