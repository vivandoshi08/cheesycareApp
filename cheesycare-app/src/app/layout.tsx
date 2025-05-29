import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CheesyCare App",
  description: "Team 254 management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-white text-brand-black min-h-screen">
        <header className="bg-brand-blue text-brand-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <Link href="/" className="font-heading text-2xl md:text-3xl font-bold mb-2 sm:mb-0">
                CheesyCare
              </Link>
              <nav className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base">
                <Link href="/teams" className="hover:text-brand-light-highlight transition-colors">
                  Teams
                </Link>
                <Link href="/people" className="hover:text-brand-light-highlight transition-colors">
                  People
                </Link>
                <Link href="/tools" className="hover:text-brand-light-highlight transition-colors">
                  Tools
                </Link>
                <Link href="/docs" className="hover:text-brand-light-highlight transition-colors">
                  Docs
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-full">
          {children}
        </main>
        <footer className="bg-brand-black text-brand-white p-4 text-center text-sm">
          <div className="container mx-auto">
            <p>© {new Date().getFullYear()} Team 254 - The Cheesy Poofs</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
