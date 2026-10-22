import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/LanguageContext";
import { INLINE_COOKIE_PURGE_SCRIPT } from "@/lib/cookieCleanup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Six9Chat | Modern Real-Time Chat Platform",
  description: "Ultra-fast, secure, and intuitive real-time messaging powered by Next.js and Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full overflow-hidden m-0 p-0 antialiased dark`}
    >
      <head>
        <script
          id="purge-bloated-cookies"
          dangerouslySetInnerHTML={{ __html: INLINE_COOKIE_PURGE_SCRIPT }}
        />
      </head>
      <body className="h-full w-full overflow-hidden m-0 p-0 flex flex-col bg-[#053b53] text-slate-100 selection:bg-[#97D7FF] selection:text-[#086288]">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
