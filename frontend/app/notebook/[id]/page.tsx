"use client";

import { use, useEffect, useState } from "react";
import { Notebook } from "@/lib/types";
import ResearchStudioShell from "@/components/ResearchStudioShell";

export default function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotebook = () => {
      const saved = localStorage.getItem("documind_notebooks");
      if (saved) {
        try {
          const notebooks: Notebook[] = JSON.parse(saved);
          const found = notebooks.find((nb) => nb.id === id);
          setNotebook(found || null);
        } catch (e) {
          console.error("Failed to parse notebooks", e);
        }
      }
      setLoading(false);
    };

    fetchNotebook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper font-mono text-xs uppercase tracking-[0.3em] text-ink/30 animate-pulse">
        Initializing Workspace...
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-paper text-center px-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-ink/20 mb-4">404</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
          Notebook not found or has been deleted.
        </p>
        <button 
          onClick={() => window.location.href = "/"}
          className="mt-8 font-mono text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return <ResearchStudioShell notebook={notebook} />;
}
