import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
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
  description:
    "Help FQHC CFOs discover, qualify, and track grant funding opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rockland-cream">
        <ClerkProvider>
          <ErrorBoundary>
            {/* Auth header — floats top-right over the existing app header */}
            <div className="fixed top-4 right-6 z-50 flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton>
                  <button className="px-3 py-1.5 text-xs font-medium text-rockland-navy/70 border border-rockland-gray rounded-lg hover:bg-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="px-3 py-1.5 text-xs font-medium bg-rockland-teal text-white rounded-lg hover:bg-rockland-teal/90 transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </Show>
            </div>
            {children}
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
