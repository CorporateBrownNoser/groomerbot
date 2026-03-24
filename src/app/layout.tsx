import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GroomerBot - AI Receptionist for Dog Groomers",
  description:
    "Never miss a client call again. GroomerBot answers your phone 24/7, books appointments, and texts you the details.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="noise-overlay min-h-full flex flex-col bg-cream">
        {children}
      </body>
    </html>
  );
}
