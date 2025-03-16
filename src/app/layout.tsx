import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Madness",
  description: "Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-900">{children}</body>
    </html>
  );
}
