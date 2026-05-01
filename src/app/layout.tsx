import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "InvoiceSnap — Invoice on WhatsApp. Get paid faster.",
  description:
    "Create professional invoices and send them via WhatsApp with a UPI payment link — built for Indian freelancers and small vendors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} dark`}>
      <body className="grain antialiased min-h-screen">{children}</body>
    </html>
  );
}
