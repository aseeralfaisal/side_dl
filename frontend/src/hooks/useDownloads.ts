import { useState, useEffect, useCallback, useRef } from "react";
import type { DownloadJob } from "../types";

const MOCK: DownloadJob[] = [
  {
    id: "1",
    url: "https://releases.ubuntu.com/24.04/ubuntu-24.04-desktop-amd64.iso",
    filename: "ubuntu-24.04-desktop-amd64.iso",
    status: "downloading",
    progress: 47.3,
    downloaded_bytes: 2_345_678_912,
    total_bytes: 4_956_123_136,
    speed: 8_523_456,
    error: null,
    created_at: "2026-07-17T10:00:00Z",
    updated_at: "2026-07-17T10:15:00Z",
  },
  {
    id: "2",
    url: "https://archlinux.org/releng/releases/2026.07.01/torrent/archlinux-2026.07.01-x86_64.iso",
    filename: "archlinux-2026.07.01-x86_64.iso",
    status: "paused",
    progress: 62.0,
    downloaded_bytes: 1_518_923_776,
    total_bytes: 2_449_876_992,
    speed: 0,
    error: null,
    created_at: "2026-07-16T14:00:00Z",
    updated_at: "2026-07-17T08:00:00Z",
  },
  {
    id: "3",
    url: "https://downloads.alpinelinux.org/alpine/v3.21/releases/x86_64/alpine-standard-3.21.0-x86_64.iso",
    filename: "alpine-standard-3.21.0-x86_64.iso",
    status: "completed",
    progress: 100,
    downloaded_bytes: 389_120_000,
    total_bytes: 389_120_000,
    speed: 0,
    error: null,
    created_at: "2026-07-15T09:00:00Z",
    updated_at: "2026-07-15T09:02:00Z",
  },
  {
    id: "4",
    url: "https://some-slow-server.org/debian-12.iso",
    filename: "debian-12.iso",
    status: "failed",
    progress: 12.5,
    downloaded_bytes: 512_000_000,
    total_bytes: 4_096_000_000,
    speed: 0,
    error: "Connection timed out after 30s",
    created_at: "2026-07-14T16:00:00Z",
    updated_at: "2026-07-14T16:30:00Z",
  },
  {
    id: "5",
    url: "https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.10.tar.xz",
    filename: "linux-6.10.tar.xz",
    status: "cancelled",
    progress: 5.0,
    downloaded_bytes: 8_192_000,
    total_bytes: 163_840_000,
    speed: 0,
    error: null,
    created_at: "2026-07-14T12:00:00Z",
    updated_at: "2026-07-14T12:05:00Z",
  },
  {
    id: "6",
    url: "https://cdn.quay.io/manifest/coreos/fedora-coreos:next",
    filename: "fedora-coreos-next.qcow2",
    status: "pending",
    progress: 0,
    downloaded_bytes: 0,
    total_bytes: 2_147_483_648,
    speed: 0,
    error: null,
    created_at: "2026-07-17T11:00:00Z",
    updated_at: "2026-07-17T11:00:00Z",
  },
];

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadJob[]>(MOCK);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const progressRef = useRef(MOCK[0].progress);

  useEffect(() => {
    const id = setInterval(() => {
      progressRef.current = Math.min(100, progressRef.current + 0.8);
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === "1"
            ? {
                ...d,
                progress: progressRef.current,
                downloaded_bytes: Math.round(
                  (d.total_bytes ?? 0) * (progressRef.current / 100),
                ),
              }
            : d,
        ),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const addDownload = useCallback(async (url: string, filename?: string) => {
    const job: DownloadJob = {
      id: crypto.randomUUID(),
      url,
      filename: filename || url.split("/").pop() || "download",
      status: "pending",
      progress: 0,
      downloaded_bytes: 0,
      total_bytes: null,
      speed: 0,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDownloads((prev) => [job, ...prev]);
  }, []);

  const pause = useCallback(async (id: string) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "paused" as const, speed: 0 } : d,
      ),
    );
  }, []);

  const resume = useCallback(async (id: string) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "downloading" as const } : d,
      ),
    );
  }, []);

  const cancel = useCallback(async (id: string) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "cancelled" as const, speed: 0 }
          : d,
      ),
    );
  }, []);

  return { downloads, loading, error, addDownload, pause, resume, cancel };
}
