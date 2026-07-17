export type DownloadStatus =
  | "pending"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface DownloadJob {
  id: string;
  url: string;
  filename: string;
  status: DownloadStatus;
  progress: number;
  downloaded_bytes: number;
  total_bytes: number | null;
  speed: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDownloadPayload {
  url: string;
  filename?: string;
}
