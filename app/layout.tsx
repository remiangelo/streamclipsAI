import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/client";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamClips AI - AI-Powered Twitch Highlight Generator",
  description: "Automatically create viral-ready clips from your Twitch VODs using AI chat analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-background text-foreground`}>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
