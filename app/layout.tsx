import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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

import { StyleProvider } from "@/components/layout/style-provider";

export const metadata: Metadata = {
  title: "DesignKit",
  description: "Plataforma de herramientas para diseño",
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
            <div className="flex h-screen overflow-hidden p-4 lg:p-6 gap-6">
              <Sidebar className="glass rounded-[2rem] shadow-2xl" />
              <div className="flex flex-1 flex-col overflow-hidden gap-6">
                <Header className="glass rounded-[2rem] shadow-xl px-8" />
                <main className="flex-1 overflow-auto rounded-[2rem] glass-panel p-8 shadow-2xl">
                  <div className="mx-auto max-w-6xl">{children}</div>
                </main>
              </div>
            </div>
            <Toaster />
            </TooltipProvider>
          </StyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
