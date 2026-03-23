import { Suspense } from "react";
import ChatStream from "@/components/ChatStream";

// Export the page properly with standard Next.js 14 Page Props interface for SearchParams
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string; pages?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="h-screen flex flex-col relative bg-paper overflow-hidden">
      
      {/* Top Navigation / Context Header */}
      <header className="absolute top-0 w-full z-10 border-b border-ink/10 bg-paper/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-ink animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold flex gap-2">
              <span className="text-accent">AI/RESEARCH</span>
              <span className="opacity-40">::</span>
              <span>TERMINAL</span>
            </span>
          </div>
          <div className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
            Context: {resolvedParams.doc ? resolvedParams.doc.slice(0, 8) + '...' : 'UNKNOWN'}
          </div>
        </div>
      </header>

      {/* Main Chat Content Wrapper */}
      <main className="flex-1 mt-16 relative">
        <Suspense fallback={<div className="font-mono text-sm p-8 mt-16">Initializing graph...</div>}>
          <ChatStream 
            fileIds={resolvedParams.doc ? [resolvedParams.doc] : []} 
            notebookId={resolvedParams.doc}
          />
        </Suspense>
      </main>
    </div>
  );
}
