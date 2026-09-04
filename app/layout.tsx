import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seller Messenger",
  description: "Bol seller outreach console",
  icons: {
    icon: '/favicon.svg',
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
      className="h-full antialiased"
    >
      <body>{children}</body>
    </html>
  );
}
