import type { Metadata } from "next";

import Header from "@/components/header/header";

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
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
