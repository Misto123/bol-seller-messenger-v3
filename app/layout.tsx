import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOL Seller Messenger - Automated Outreach",
  description: "Automated messaging tool for contacting BOL.com sellers",
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
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
