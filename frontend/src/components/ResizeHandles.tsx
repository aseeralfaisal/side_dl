import { getCurrentWindow, type ResizeDirection } from "@tauri-apps/api/window";

const HANDLE_SIZE = 6;

const handles: { dir: ResizeDirection; style: React.CSSProperties }[] = [
  { dir: "North",      style: { top: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "n-resize" } },
  { dir: "South",      style: { bottom: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "s-resize" } },
  { dir: "West",       style: { top: HANDLE_SIZE, bottom: HANDLE_SIZE, left: 0, width: HANDLE_SIZE, cursor: "w-resize" } },
  { dir: "East",       style: { top: HANDLE_SIZE, bottom: HANDLE_SIZE, right: 0, width: HANDLE_SIZE, cursor: "e-resize" } },
  { dir: "NorthWest",  style: { top: 0, left: 0, width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "nw-resize" } },
  { dir: "NorthEast",  style: { top: 0, right: 0, width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "ne-resize" } },
  { dir: "SouthWest",  style: { bottom: 0, left: 0, width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "sw-resize" } },
  { dir: "SouthEast",  style: { bottom: 0, right: 0, width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: "se-resize" } },
];

export function ResizeHandles() {
  const onPointerDown = (dir: ResizeDirection) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    getCurrentWindow().startResizeDragging(dir);
  };

  return (
    <>
      {handles.map((h) => (
        <div
          key={h.dir}
          className="resize-handle"
          style={h.style}
          onPointerDown={onPointerDown(h.dir)}
        />
      ))}
    </>
  );
}
