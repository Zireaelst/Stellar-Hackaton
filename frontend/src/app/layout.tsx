import type { Metadata } from "next";
import { Syne, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StellarVeil — Privacy Pools on Stellar",
  description:
    "Compliance-aware privacy pools on the Stellar network. Deposit, withdraw, and transact privately while maintaining regulatory compatibility through association sets and zero-knowledge proofs.",
  keywords: [
    "Stellar",
    "privacy",
    "zero-knowledge proofs",
    "compliance",
    "Soroban",
    "privacy pools",
  ],
  openGraph: {
    title: "StellarVeil — Privacy Pools on Stellar",
    description:
      "Compliance-aware privacy pools on the Stellar network.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-dm bg-sv-bg text-[#EDF2F7] noise-overlay scanlines">
        {children}
      </body>
    </html>
  );
}
