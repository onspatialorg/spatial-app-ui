import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://onspatial.org";
const TITLE = "Spatial | Fixed-rate loans against tokenized stocks";
const DESCRIPTION =
  "Spatial is a peer-to-peer lending market on Robinhood Chain. Pledge Stock Tokens, borrow USDG at a rate and term agreed with a syndicate of lenders, and follow every fill, repayment and auction on-chain.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Spatial",
  },
  description: DESCRIPTION,
  applicationName: "Spatial",
  keywords: [
    "Spatial",
    "Robinhood Chain",
    "tokenized stocks",
    "RWA lending",
    "peer-to-peer lending",
    "USDG",
    "securities-backed lending",
    "DeFi",
  ],
  authors: [{ name: "Spatial", url: SITE_URL }],
  creator: "Spatial",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Spatial",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@onspatial",
    creator: "@onspatial",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f9fa",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable}`}>
      <body className="min-h-screen bg-canvas text-navy antialiased">{children}</body>
    </html>
  );
}
