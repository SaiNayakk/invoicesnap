import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay invoice", robots: { index: false } };

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
