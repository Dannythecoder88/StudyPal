import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyPal - AI-Powered Study Tracker & Planner",
  description: "Smart study planning and productivity tracking for students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
