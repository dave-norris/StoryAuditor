import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryAuditor",
  description: "A simple and elegant application",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            themes={["paper", "night"]}
            enableSystem={true}
            value={{ light: "paper", dark: "night" }}
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
