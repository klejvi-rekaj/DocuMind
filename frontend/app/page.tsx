"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Network, Plus, Trash2 } from "lucide-react";

import { CreateNotebookModal } from "@/components/CreateNotebookModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotebooks } from "@/hooks/useNotebooks";
import { Notebook } from "@/lib/types";

const bentoSpans = [
  "lg:col-span-5",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-5",
  "lg:col-span-3",
];

export default function Home() {
  const router = useRouter();
  const { notebooks, createNotebook, deleteNotebook, isCreating } = useNotebooks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Notebook | null>(null);

  const handleCreate = async (title: string, files: File[]) => {
    try {
      const notebook = await createNotebook(title, files);
      router.push(`/notebook/${notebook.id}`);
    } catch (error) {
      console.error("Failed to create notebook:", error);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteNotebook(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-paper text-ink">
      <div className="app-shell-glow" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10 flex-1 overflow-y-initial">
        <header className="surface-card rounded-[28px] px-6 py-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40 font-medium">Workspace</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">DocuMind</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="shimmer-button rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create notebook
            </span>
          </button>
        </header>

        <section className="surface-card rounded-[32px] p-6 lg:p-8">
          <div className="flex items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35 mb-3 font-medium">Notebook library</p>
              <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                Research notebooks in a darker, sharper workspace.
              </h2>
            </div>
            <div className="hidden lg:block text-right text-sm text-white/45 max-w-xs">
              Upload sources, open a notebook, and keep the conversation focused on the material you actually care about.
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 auto-rows-[180px]">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="surface-card col-span-12 lg:col-span-4 rounded-[28px] p-6 text-left transition-transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6">
                <Plus className="w-6 h-6 text-[#aab7ff]" strokeWidth={2.4} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Create new notebook</h3>
              <p className="text-sm text-white/45 max-w-sm">
                Start a fresh workspace and drop in PDFs to build a focused research thread.
              </p>
            </button>

            <div className="surface-card col-span-12 lg:col-span-8 rounded-[28px] p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/35 font-medium">Library status</p>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/55">
                  {notebooks.length} notebooks
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-white">{notebooks.length}</p>
                  <p className="text-sm text-white/45">Saved notebooks ready to reopen.</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {notebooks.reduce((count, notebook) => count + notebook.sourceCount, 0)}
                  </p>
                  <p className="text-sm text-white/45">Total uploaded sources across your workspace.</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-white">
                    {notebooks.length ? notebooks[0].dateLabel : "--"}
                  </p>
                  <p className="text-sm text-white/45">Most recent notebook activity.</p>
                </div>
              </div>
            </div>

            {notebooks.map((notebook, index) => (
              <div
                key={notebook.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/notebook/${notebook.id}`)}
                onKeyDown={(event) => event.key === "Enter" && router.push(`/notebook/${notebook.id}`)}
                className={`surface-card col-span-12 ${bentoSpans[index % bentoSpans.length]} rounded-[28px] p-6 flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-white/80" strokeWidth={1.8} />
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete(notebook);
                    }}
                    className="shimmer-button rounded-full w-10 h-10 flex items-center justify-center text-white/80 hover:text-white shrink-0"
                    aria-label={`Delete ${notebook.title}`}
                  >
                    <span className="relative z-10">
                      <Trash2 className="w-4 h-4" strokeWidth={1.9} />
                    </span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35 font-medium">
                    <span>{notebook.dateLabel}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{notebook.sourceCount} sources</span>
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-white max-w-lg">
                    {notebook.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
        isCreating={isCreating}
      />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="surface-card sm:max-w-md rounded-[28px] overflow-hidden text-white">
          <DialogHeader className="p-2">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-white">Delete notebook</DialogTitle>
            <DialogDescription className="text-white/50">
              {pendingDelete
                ? `Delete "${pendingDelete.title}"? This removes it from your current workspace view.`
                : "Delete this notebook?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="bg-white/[0.02] p-6 -mx-6 -mb-6 mt-2 flex sm:justify-between items-center gap-4">
            <button
              onClick={() => setPendingDelete(null)}
              className="shimmer-button rounded-2xl px-5 py-3 text-sm font-semibold text-white/80"
            >
              <span className="relative z-10">Cancel</span>
            </button>
            <button
              onClick={confirmDelete}
              className="shimmer-button rounded-2xl px-6 py-3 text-sm font-semibold text-white"
            >
              <span className="relative z-10">Delete</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
