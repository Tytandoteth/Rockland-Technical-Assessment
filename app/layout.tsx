import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rockland — Grant Discovery for FQHCs",
  description: "Help FQHC CFOs discover, qualify, and track grant funding opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

  const inner = (
    <ErrorBoundary>{children}</ErrorBoundary>
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rockland-cream">
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>{inner}</ClerkProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
