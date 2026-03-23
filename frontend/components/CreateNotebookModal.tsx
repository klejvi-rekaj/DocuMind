"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, UploadCloud, File as FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, files: File[]) => Promise<any>;
  isCreating: boolean;
}

export function CreateNotebookModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateNotebookModalProps) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title || files.length === 0) return;
    try {
      await onCreate(title, files);
      setTitle("");
      setFiles([]);
      onClose();
    } catch (error) {
      console.error("Failed to create notebook", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="surface-card sm:max-w-md rounded-[28px] overflow-hidden text-white">
        <DialogHeader className="p-2">
          <DialogTitle>Create new notebook</DialogTitle>
          <DialogDescription>
            Give your notebook a title and upload PDFs to start a new dark-mode workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 px-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-white/75 tracking-tight">
              Notebook Title
            </label>
            <input
              id="title"
              placeholder="e.g. Research on AI agents"
              className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.03] focus:outline-none focus:border-white/20 transition-all font-sans text-white placeholder:text-white/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div
            className={cn(
              "relative border rounded-[28px] p-10 transition-all flex flex-col items-center justify-center gap-3 bg-white/[0.02]",
              isDragging ? "border-white/20 bg-white/[0.05]" : "border-white/10 hover:border-white/20",
              files.length > 0 ? "pb-6" : "",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={isCreating}
            />
            <div className="w-14 h-14 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center">
              <UploadCloud className="w-7 h-7 text-white/80" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white tracking-tight">Click or drag PDFs here</p>
              <p className="text-xs text-white/45 mt-1">PDF only. Your sources stay in this workspace.</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/10">
                      <FileIcon className="w-4 h-4 text-white/55" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-medium text-white/80 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="shimmer-button rounded-xl p-1.5 text-white/55 hover:text-white"
                    disabled={isCreating}
                  >
                    <span className="relative z-10">
                      <X className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="bg-white/[0.02] p-6 -mx-6 -mb-6 mt-2 flex sm:justify-between items-center gap-4">
          <button
            onClick={onClose}
            className="shimmer-button rounded-2xl px-5 py-3 text-sm font-semibold text-white/75"
            disabled={isCreating}
          >
            <span className="relative z-10">Cancel</span>
          </button>
          <button
            onClick={handleCreate}
            disabled={!title || files.length === 0 || isCreating}
            className="shimmer-button rounded-2xl px-8 py-3 text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span>Processing sources...</span>
                </>
              ) : (
                "Create Notebook"
              )}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
