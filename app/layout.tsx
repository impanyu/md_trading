import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MD Exchange",
  description: "Publish, share, and trade markdown skill files for humans and agents."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
