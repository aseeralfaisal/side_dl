import { useState, useEffect, useCallback, useRef } from "react";
import type { DownloadJob } from "../types";
import { api } from "../api/downloads";

const POLL_MS = 1500;

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDownloads = useCallback(async () => {
    try {
      const jobs = await api.listDownloads();
      setDownloads(jobs);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to fetch downloads",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
    intervalRef.current = setInterval(fetchDownloads, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDownloads]);

  const addDownload = useCallback(
    async (url: string, filename?: string) => {
      await api.createDownload({ url, filename });
      await fetchDownloads();
    },
    [fetchDownloads],
  );

  const pause = useCallback(
    async (id: string) => {
      await api.pauseDownload(id);
      await fetchDownloads();
    },
    [fetchDownloads],
  );

  const resume = useCallback(
    async (id: string) => {
      await api.resumeDownload(id);
      await fetchDownloads();
    },
    [fetchDownloads],
  );

  const cancel = useCallback(
    async (id: string) => {
      await api.cancelDownload(id);
      await fetchDownloads();
    },
    [fetchDownloads],
  );

  return { downloads, loading, error, addDownload, pause, resume, cancel };
}
