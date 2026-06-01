import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryAuditor",
  description: "A simple and elegant application",
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
