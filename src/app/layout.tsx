import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import ParticleBackground from "./components/ParticleBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synced - AI Automation Discovery",
  description: "Discover and implement AI-powered automation solutions for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ParticleBackground />
        <div className="relative z-10">
          <Header />
          <Toaster position="top-center" />
          {children}
        </div>
      </body>
    </html>
  );
}
