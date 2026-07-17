import { memo } from "react";
import { DownloadItem } from "./DownloadItem";
import type { DownloadJob } from "../types";

interface Props {
  downloads: DownloadJob[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

export const DownloadList = memo(function DownloadList({ downloads, selectedIndex, onSelect, onPause, onResume, onCancel }: Props) {
  if (downloads.length === 0) {
    return (
      <div className="download-list-empty">
        <div className="empty-icon">+</div>
        <p className="empty-text">No downloads yet</p>
        <p className="empty-hint">
          Press <kbd>a</kbd> or <kbd>i</kbd> to add a new download
        </p>
      </div>
    );
  }

  return (
    <div className="download-list">
      {downloads.map((job, i) => (
        <DownloadItem key={job.id} job={job} selected={i === selectedIndex} onSelect={() => onSelect(i)} onPause={onPause} onResume={onResume} onCancel={onCancel} />
      ))}
    </div>
  );
});
