import { useState, useCallback, useMemo } from "react";
import { useDownloads } from "./hooks/useDownloads";
import { useVimNavigation } from "./hooks/useVimKeybindings";
import type { Action } from "./hooks/useVimKeybindings";
import type { DownloadStatus } from "./types";
import { DownloadList } from "./components/DownloadList";
import { AddDownloadModal } from "./components/AddDownloadModal";
import { HelpModal } from "./components/HelpModal";
import { StatusBar } from "./components/StatusBar";
import { TitleBar } from "./components/TitleBar";
import { ResizeHandles } from "./components/ResizeHandles";

type ModalState = "none" | "add" | "help";

const TABS: { id: DownloadStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "downloading", label: "Downloading" },
  { id: "paused", label: "Paused" },
  { id: "pending", label: "Queued" },
  { id: "completed", label: "Completed" },
];

const TAB_ICONS: Record<string, { d: string; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }[]> = {
  all: [{ d: "M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" }],
  downloading: [
    { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 6V13H16L12 17L8 13H11V6H13Z" },
  ],
  paused: [{ d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14H8V8h2v8zm6 0h-2V8h2v8z" }],
  pending: [{ d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" }],
  completed: [{ d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }],
};

function App() {
  const { downloads, loading, error, addDownload, pause, resume, cancel } =
    useDownloads();
  const [modal, setModal] = useState<ModalState>("none");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DownloadStatus | "all">("all");

  const filteredDownloads = useMemo(
    () =>
      activeTab === "all"
        ? downloads
        : downloads.filter((d) => d.status === activeTab),
    [downloads, activeTab],
  );

  const handleAction = useCallback(
    (action: Action, index: number) => {
      const job = filteredDownloads[index];

      switch (action) {
        case "add":
          setModal("add");
          break;
        case "help":
          setModal((prev) => (prev === "help" ? "none" : "help"));
          break;
        case "escape":
          setModal("none");
          break;
        case "pause":
          if (job?.status === "downloading") pause(job.id);
          break;
        case "resume":
          if (job?.status === "paused" || job?.status === "pending") resume(job.id);
          break;
        case "cancel":
          if (
            job?.status === "downloading" ||
            job?.status === "paused" ||
            job?.status === "pending"
          ) {
            cancel(job.id);
          }
          break;
        case "tabLeft": {
          const curIdx = TABS.findIndex((t) => t.id === activeTab);
          if (curIdx > 0) setActiveTab(TABS[curIdx - 1].id);
          break;
        }
        case "tabRight": {
          const curIdx = TABS.findIndex((t) => t.id === activeTab);
          if (curIdx < TABS.length - 1) setActiveTab(TABS[curIdx + 1].id);
          break;
        }
        default:
          break;
      }
    },
    [filteredDownloads, pause, resume, cancel],
  );

  const { selectedIndex, setSelectedIndex } = useVimNavigation({
    itemCount: filteredDownloads.length,
    onAction: handleAction,
    enabled: modal === "none",
  });

  const statusCounts = useMemo(() => ({
    active: downloads.filter((d) => d.status === "downloading").length,
    paused: downloads.filter((d) => d.status === "paused").length,
    completed: downloads.filter((d) => d.status === "completed").length,
    total: downloads.length,
    totalSpeed: downloads
      .filter((d) => d.status === "downloading")
      .reduce((sum, d) => sum + d.speed, 0),
  }), [downloads]);

  const handleHelpClick = useCallback(() => setModal("help"), []);

  const handleAddDownload = useCallback(
    async (url: string, filename?: string) => {
      setSubmissionError(null);
      try {
        await addDownload(url, filename);
        setModal("none");
      } catch (e) {
        setSubmissionError(
          e instanceof Error ? e.message : "Failed to start download",
        );
      }
    },
    [addDownload],
  );

  if (loading) {
    return (
      <div className="app">
        <div className="loading">loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <ResizeHandles />
      <TitleBar>
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" className="tab-icon">
                {TAB_ICONS[tab.id].map((p, i) => (
                  <path key={i} d={p.d} fill={p.fill ?? "currentColor"} stroke={p.stroke} strokeWidth={p.strokeWidth} opacity={p.opacity ?? 1} />
                ))}
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </TitleBar>

      {error && downloads.length > 0 && (
        <div className="error-banner">
          <span>!</span> {error}
        </div>
      )}

      <main className="app-main">
        <DownloadList downloads={filteredDownloads} selectedIndex={selectedIndex} onSelect={setSelectedIndex} onPause={pause} onResume={resume} onCancel={cancel} />
      </main>

      <StatusBar {...statusCounts} onHelpClick={handleHelpClick} />

      {modal === "add" && (
        <AddDownloadModal
          onSubmit={handleAddDownload}
          onClose={() => {
            setModal("none");
            setSubmissionError(null);
          }}
          error={submissionError}
        />
      )}
      {modal === "help" && <HelpModal onClose={() => setModal("none")} />}
    </div>
  );
}

export default App;
