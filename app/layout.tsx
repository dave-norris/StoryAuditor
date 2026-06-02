import type { Metadata } from "next";
import { VersionFooter } from "./components/VersionFooter";
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
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <VersionFooter />
      </body>
    </html>
  );
}
