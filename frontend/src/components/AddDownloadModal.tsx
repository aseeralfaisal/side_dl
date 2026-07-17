import { useState, useRef, useEffect } from "react";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { Modal } from "./Modal";

interface Props {
  onSubmit: (url: string, filename?: string) => void;
  onClose: () => void;
  error: string | null;
}

export function AddDownloadModal({ onSubmit, onClose, error }: Props) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEscapeKey(onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim(), filename.trim() || undefined);
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <span className="modal-title">+ new download</span>
        <span className="modal-hint">esc to cancel</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="modal-field">
          <label className="modal-label">url</label>
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/file.zip"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="modal-field">
          <label className="modal-label">
            filename <span className="modal-optional">(optional)</span>
          </label>
          <input
            className="modal-input"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="auto-detect from url"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button type="submit" className="modal-btn primary">
            enter to start
          </button>
          <button type="button" className="modal-btn" onClick={onClose}>
            esc to cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
