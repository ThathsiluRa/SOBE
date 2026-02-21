import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BANKI — AI Banking Kiosk",
  description: "AI-powered voice banking kiosk with KYC verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
