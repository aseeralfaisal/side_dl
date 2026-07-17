import { memo } from "react";
import type { DownloadJob } from "../types";
import { formatBytes, formatSpeed } from "../utils/format";
import { ICON_PAUSE, ICON_PLAY, ICON_CHECK, ICON_CLOSE, ICON_CANCEL, ICON_STOP } from "../utils/icons";
import { Icon } from "./Icon";

interface Props {
  job: DownloadJob;
  selected: boolean;
  onSelect: () => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

function formatEta(job: DownloadJob): string {
  if (!job.total_bytes || job.speed === 0) return "\u2014:——";
  const remaining = job.total_bytes - job.downloaded_bytes;
  const seconds = Math.ceil(remaining / job.speed);
  if (seconds > 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h${m.toString().padStart(2, "0")}m`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  downloading: "Active",
  paused: "Paused",
  completed: "Done",
  failed: "Error",
  cancelled: "Cancelled",
};

const FILE_TYPE_PATHS: Record<string, string> = {
  image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  video: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
  audio: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  archive: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 12H6v-2h8v2zm4-4H6v-2h12v2z",
  document: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  code: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
  executable: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  font: "M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z",
  default: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z",
};

function getFileTypePath(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico", "tiff"].includes(ext)) return FILE_TYPE_PATHS.image;
  if (["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v"].includes(ext)) return FILE_TYPE_PATHS.video;
  if (["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"].includes(ext)) return FILE_TYPE_PATHS.audio;
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz"].includes(ext)) return FILE_TYPE_PATHS.archive;
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md"].includes(ext)) return FILE_TYPE_PATHS.document;
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "h", "rs", "go", "rb", "php", "html", "css", "json", "xml", "yaml", "yml", "toml", "sh"].includes(ext)) return FILE_TYPE_PATHS.code;
  if (["exe", "msi", "dmg", "app", "deb", "rpm", "pkg", "appimage"].includes(ext)) return FILE_TYPE_PATHS.executable;
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) return FILE_TYPE_PATHS.font;
  return FILE_TYPE_PATHS.default;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
    </div>
  );
}

const CTRL_ICONS: Record<string, string> = {
  downloading: ICON_PAUSE,
  paused: ICON_PLAY,
  pending: ICON_PLAY,
  completed: ICON_CHECK,
  failed: ICON_CLOSE,
  cancelled: ICON_CANCEL,
};

export const DownloadItem = memo(function DownloadItem({ job, selected, onSelect, onPause, onResume, onCancel }: Props) {
  const handleControlClick = () => {
    if (job.status === "downloading") onPause(job.id);
    else if (job.status === "paused" || job.status === "pending" || job.status === "cancelled") onResume(job.id);
  };

  return (
    <div className={`download-item ${selected ? "selected" : ""} status-${job.status}`} onClick={onSelect}>
      <div className="dl-left-controls">
        <button className="dl-btn-play" onClick={handleControlClick} title={job.status === "downloading" ? "Pause" : "Resume"}>
          <Icon path={CTRL_ICONS[job.status]} size={16} />
        </button>
      </div>
      <div className="dl-content">
        <div className="dl-header">
          <Icon path={getFileTypePath(job.filename || job.url)} size={14} className="dl-file-icon" />
          <span className="dl-filename">{job.filename || job.url}</span>
          <span className={`dl-status-badge status-${job.status}`}>
            {STATUS_LABELS[job.status]}
          </span>
        </div>
        {(job.status === "downloading" || job.status === "paused" || job.status === "completed" || job.status === "failed") && (
          <div className="dl-progress-row">
            <ProgressBar progress={job.progress} />
            <div className="progress-details">
              <span>{job.progress.toFixed(1)}%</span>
              <span>
                {formatBytes(job.downloaded_bytes)}
                {job.total_bytes ? ` / ${formatBytes(job.total_bytes)}` : ""}
              </span>
            </div>
          </div>
        )}
        {(job.status === "downloading" || job.status === "paused" || job.status === "pending") && (
          <div className="dl-footer">
            <span className="dl-speed">{formatSpeed(job.speed)}</span>
            <span className="dl-eta">{job.status === "downloading" ? `ETA ${formatEta(job)}` : job.status === "paused" ? "Paused" : "Queued"}</span>
            <span className="dl-actions">
              {(job.status === "downloading" || job.status === "paused" || job.status === "pending") && (
                <button className="dl-btn dl-btn-stop" onClick={() => onCancel(job.id)} title="Cancel">
                  <Icon path={ICON_STOP} size={12} />
                </button>
              )}
            </span>
          </div>
        )}
        {job.error && (
          <div className="dl-error">{job.error}</div>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.job === next.job && prev.selected === next.selected);
