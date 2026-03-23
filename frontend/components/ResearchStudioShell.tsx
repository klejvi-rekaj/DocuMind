"use client";

import { Check, FileText, LayoutGrid, MoreVertical, Network, Plus } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import ChatStream from "@/components/ChatStream";
import { Notebook } from "@/lib/types";

interface ResearchStudioShellProps {
  notebook: Notebook;
}

export default function ResearchStudioShell({ notebook }: ResearchStudioShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper text-ink">
      <div className="app-shell-glow" />

      <div className="relative h-screen overflow-hidden px-4 py-4">
        <div className="h-full flex flex-col overflow-hidden">
          <header className="surface-card rounded-[28px] px-6 py-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Network className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/35 font-medium">Notebook</p>
                <h1 className="text-2xl font-semibold tracking-tight text-white">{notebook.title}</h1>
              </div>
            </div>

            <button className="shimmer-button rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
              <span className="relative z-10 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Create notebook
              </span>
            </button>
          </header>

          <div className="flex-1 overflow-hidden min-h-0">
            <Group orientation="horizontal" className="h-full">
              <Panel defaultSize={24} minSize={18} className="h-full min-h-0 pr-2">
                <div className="surface-card h-full rounded-[28px] flex flex-col overflow-hidden min-h-0">
                  <div className="p-5 flex items-center justify-between border-b border-white/5">
                    <span className="text-[15px] font-semibold tracking-tight text-white">Sources</span>
                    <LayoutGrid className="w-4 h-4 text-white/35" />
                  </div>

                  <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                    <button className="shimmer-button w-full py-3 rounded-2xl text-[13px] font-semibold text-white">
                      <span className="relative z-10 inline-flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Add sources
                      </span>
                    </button>

                    <div className="mt-2">
                      <div className="flex items-center justify-between px-1 mb-4">
                        <span className="text-[12px] font-semibold text-white/55 tracking-tight">Selected sources</span>
                        <div className="w-4 h-4 rounded border border-white/10 flex items-center justify-center bg-white/[0.03]">
                          <Check className="w-3 h-3 text-white/65" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {notebook.filenames.map((name, index) => (
                          <div key={`${name}-${index}`} className="flex items-center justify-between p-3 rounded-2xl border border-white/8 bg-white/[0.02]">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/10 shrink-0">
                                <FileText className="w-4 h-4 text-white/60" />
                              </div>
                              <span className="text-[13px] font-medium text-white/80 truncate leading-tight">{name}</span>
                            </div>
                            <div className="w-4 h-4 rounded border border-white/10 flex items-center justify-center bg-white/[0.03] shrink-0">
                              <Check className="w-3 h-3 text-white/60" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <Separator className="w-0" />

              <Panel defaultSize={76} minSize={45} className="h-full min-h-0 pl-2">
                <div className="surface-card h-full rounded-[28px] flex flex-col overflow-hidden min-h-0">
                  <div className="p-5 flex items-center justify-between border-b border-white/5">
                    <span className="text-[15px] font-semibold tracking-tight text-white">Chat</span>
                    <MoreVertical className="w-4 h-4 text-white/35" />
                  </div>

                  <div className="flex-1 overflow-hidden relative bg-transparent min-h-0">
                    <ChatStream fileIds={notebook.fileIds || []} notebookId={notebook.id} />
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        </div>
      </div>
    </div>
  );
}
