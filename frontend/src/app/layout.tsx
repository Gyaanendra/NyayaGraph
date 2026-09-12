import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CYBERLIFE // Detroit: Become Human Interface & Flowchart Workflow",
  description: "High-tech CyberLife HUD interface and interactive decision flowchart system inspired by Detroit: Become Human.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
