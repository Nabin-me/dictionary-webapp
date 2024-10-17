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
  title: "Vocabulicious | A vocabulary building app",
  description: "A dictionary app built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${aspektaSans.variable} antialiased flex flex-col min-h-screen`}
      >
        <main className="flex-grow flex items-center justify-center">
          {children}
        </main>
        <footer className="flex justify-center space-x-4 text-md tracking-tight p-4">
          Developed by:{" "}
          <Link
            href="https://github.com/Nabin-me"
            className="hover:underline ml-1 text-blue-500"
            target="_blank"
          >
            Nabin Dahal
          </Link>
        </footer>
      </body>
    </html>
  );
}
