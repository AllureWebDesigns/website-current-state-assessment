import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Current State Assessment",
  description: "Assess website performance, SEO, accessibility, security posture, and UX.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
