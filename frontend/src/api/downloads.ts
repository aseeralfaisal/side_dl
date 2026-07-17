import type { CreateDownloadPayload, DownloadJob } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...init,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${res.status}: ${body || res.statusText}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  listDownloads: () => request<DownloadJob[]>("/downloads"),

  getDownload: (id: string) => request<DownloadJob>(`/downloads/${id}`),

  createDownload: (payload: CreateDownloadPayload) =>
    request<DownloadJob>("/downloads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  pauseDownload: (id: string) =>
    request<DownloadJob>(`/downloads/${id}/pause`, { method: "POST" }),

  resumeDownload: (id: string) =>
    request<DownloadJob>(`/downloads/${id}/resume`, { method: "POST" }),

  cancelDownload: (id: string) =>
    request<DownloadJob>(`/downloads/${id}/cancel`, { method: "POST" }),
};
