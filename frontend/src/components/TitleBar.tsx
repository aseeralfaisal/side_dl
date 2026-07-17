import { type ReactNode, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}

function WindowButton({ onClick, label, className, children }: WindowButtonProps) {
  return (
    <button className={`titlebar-btn ${className ?? ""}`} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

interface TitleBarProps {
  children: ReactNode;
}

export function TitleBar({ children }: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const update = () => appWindow.isMaximized().then((m) => {
      setMaximized(m);
      document.documentElement.classList.toggle("maximized", m);
    });
    appWindow.onResized(update);
    update();
  }, [appWindow]);

  return (
    <div data-tauri-drag-region="deep" className="titlebar" onDoubleClick={() => appWindow.toggleMaximize()}>
      <div className="titlebar-left">
        <svg className="titlebar-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2.5l9.5 5.5v11L14 24.5 4.5 19V8L14 2.5z" />
          <path d="M14 8.5v8" />
          <path d="M10 12.5l4 4 4-4" />
        </svg>
        <span className="titlebar-title">side_dl</span>
        {children}
      </div>
      <div className="titlebar-controls">
        <WindowButton onClick={() => appWindow.minimize()} label="Minimize">
          <svg viewBox="0 0 12 12" width="12" height="12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
          </svg>
        </WindowButton>
        <WindowButton onClick={() => appWindow.toggleMaximize()} label="Maximize">
          {maximized ? (
            <svg viewBox="0 0 12 12" width="12" height="12">
              <rect x="2.5" y="0.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="0.5" y="2.5" width="9" height="9" rx="1" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="12" height="12">
              <rect x="1" y="1" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </WindowButton>
        <WindowButton onClick={() => appWindow.close()} label="Close" className="titlebar-close">
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </WindowButton>
      </div>
    </div>
  );
}
