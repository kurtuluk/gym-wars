import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GYM WARS - Oyunlaştırılmış Fitness Takip",
  description: "Arkadaşlarınla savaş, antrenman yap, GymCoin kazan ve Black Market'ten özel eşyalar satın al!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900`}
      >
        {children}
      </body>
    </html>
  );
}
