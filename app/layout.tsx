import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/app-providers/AppProviders";

export const metadata: Metadata = {
  title: "Vendo Medicine Machine | Los Amigos SHS",
  description:
    "A student-developed medicine vending machine for Los Amigos Senior High School.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
