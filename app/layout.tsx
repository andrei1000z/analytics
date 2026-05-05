import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EuroAnalytics — Privacy-first analytics",
  description:
    "Zero-tracking, GDPR-friendly analytics for European builders. No cookies, no fingerprinting, just clear numbers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
