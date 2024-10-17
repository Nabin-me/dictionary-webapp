import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";

const aspektaSans = localFont({
  src: "./fonts/AspektaVF.woff2",
  variable: "--font-aspekta-sans",
  weight: "100 950",
});

export const metadata: Metadata = {
  title: "MyDictionary | A dictionary app",
  description: "A dictionary app built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${aspektaSans.variable} antialiased`}>
        <header className="p-10 flex justify-end space-x-4 text-xl">
          <Link href="#" className="hover:underline ">
            Dictionary
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
