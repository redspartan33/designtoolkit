import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { StyleProvider } from "@/components/layout/style-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DesignKit",
  description: "Tu suite premium de herramientas de diseño",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StyleProvider>
            <TooltipProvider>
              {/* Desktop layout */}
              <div className="hidden lg:flex h-screen overflow-hidden p-4 gap-4">
                <Sidebar className="glass rounded-[2rem] shadow-2xl" />
                <div className="flex flex-1 flex-col overflow-hidden gap-4">
                  <Header className="glass rounded-[2rem] shadow-xl px-2" />
                  <main className="flex-1 overflow-auto rounded-[2rem] glass-panel shadow-xl">
                    <div className="mx-auto max-w-6xl p-8">{children}</div>
                  </main>
                </div>
              </div>

              {/* Mobile layout */}
              <div className="lg:hidden flex flex-col min-h-screen">
                <Header className="glass border-b border-white/10 px-2 shrink-0" />
                <main className="flex-1 overflow-auto pb-20">
                  <div className="max-w-2xl mx-auto p-4">{children}</div>
                </main>
                <MobileNav />
              </div>

              <CommandPalette />
              <Toaster />
            </TooltipProvider>
          </StyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
