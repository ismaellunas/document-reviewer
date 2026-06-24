import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { getSiteUrl } from "@/lib/config/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "GEWCI Ministry Tools",
  description:
    "Browse approved ministry documents and access GEWCI tools for review, collaboration, and presentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gewci-white text-gewci-dark font-sans">
        <NextTopLoader color="#DBB64B" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
