import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Document Research Terminal",
  description: "High-end editorial document analysis semantic engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-ink bg-paper selection:bg-ink selection:text-paper min-h-screen overflow-y-auto overflow-x-hidden" style={{ cursor: "default" }}>
        <div className="paper-texture"></div>
        <main className="relative z-10 w-full min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
