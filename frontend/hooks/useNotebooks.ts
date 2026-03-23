"use client";

import { useState, useEffect } from "react";
import { Notebook } from "@/lib/types";

const LOCAL_STORAGE_KEY = "documind_notebooks";

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setNotebooks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notebooks from localStorage", e);
      }
    }
  }, []);

  // Sync to localStorage whenever notebooks change
  const updateNotebooks = (newNotebooks: Notebook[]) => {
    setNotebooks(newNotebooks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newNotebooks));
  };

  const createNotebook = async (title: string, files: File[]) => {
    setIsCreating(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        
        // Use environment variable or fallback to localhost
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5m timeout

        try {
          const response = await fetch(`${baseUrl}/api/upload`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
            throw new Error(errorData.detail || `Failed to upload ${file.name}`);
          }

          return response.json();
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === "AbortError") {
            throw new Error(`Upload timed out for ${file.name}. The server might be busy.`);
          }
          throw err;
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      const fileIds = uploadResults.map(res => res.file_id);
      const filenames = files.map(file => file.name);

      const newNotebook: Notebook = {
        id: crypto.randomUUID(),
        title,
        dateLabel: new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date()),
        sourceCount: files.length,
        pastelIndex: notebooks.length % 4,
        fileIds,
        filenames,
      };

      const updated = [newNotebook, ...notebooks];
      updateNotebooks(updated);
      
      return newNotebook;
    } catch (error) {
      console.error("Error creating notebook:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteNotebook = (notebookId: string) => {
    const updated = notebooks.filter((notebook) => notebook.id !== notebookId);
    updateNotebooks(updated);
  };

  return {
    notebooks,
    createNotebook,
    deleteNotebook,
    isCreating,
  };
}
