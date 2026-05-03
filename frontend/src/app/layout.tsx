import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Traffic Management Simulation",
  description: "IoT-based Smart Traffic Management System Simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        <div className="min-h-screen flex flex-col">
          {/* ── Top Navigation Bar ──────────────────────────────── */}
          <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 hidden sm:block">
                Traffic Simulator
              </span>
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 flex-wrap" aria-label="Main navigation">
              {[
                { href: "/",          label: "Dashboard",   icon: "⊞" },
                { href: "/traffic",   label: "Traffic",     icon: "🚦" },
                { href: "/analytics", label: "Analytics",   icon: "📊" },
                { href: "/iot",       label: "IoT Sensors", icon: "📡" },
                { href: "/logs",      label: "Logs",        icon: "📋" },
                { href: "/settings",  label: "Settings",    icon: "⚙️" },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150"
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>

            <div className="text-xs text-slate-500 font-medium hidden md:block">
              IoT Control Center
            </div>
          </header>

          {/* ── Page Content ──────────────────────────────────── */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
