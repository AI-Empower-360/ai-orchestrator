import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Med - Doctor Dashboard",
  description: "AI Agentic Internal Medicine Platform - Doctor Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
