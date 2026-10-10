import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CashPractice", template: "%s · CashPractice" },
  description: "Scheduling, notes, and superbills for a solo practice that does not bill insurance.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0c4f3e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
