import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Okan Acer | Room",
  description:
    "Three.js ile olusturulmus gezilebilir calisma odasi.",
  openGraph: {
    title: "Okan Acer | Room",
    description: "Gezilebilir calisma odasi deneyimi.",
    siteName: "Okan Acer Portfolio",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ece3d7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
