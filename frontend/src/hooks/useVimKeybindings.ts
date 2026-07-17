import { useEffect, useCallback, useRef, useState } from "react";

export type Action =
  | "moveUp"
  | "moveDown"
  | "selectFirst"
  | "selectLast"
  | "pause"
  | "resume"
  | "cancel"
  | "add"
  | "help"
  | "escape"
  | "submit"
  | "tabLeft"
  | "tabRight";

interface VimKeymap {
  key: string;
  ctrl?: boolean;
  action: Action;
}

const DEFAULT_KEYMAP: VimKeymap[] = [
  { key: "j", action: "moveDown" },
  { key: "k", action: "moveUp" },
  { key: "h", action: "tabLeft" },
  { key: "l", action: "tabRight" },
  { key: "G", action: "selectLast" },
  { key: "p", action: "pause" },
  { key: "r", action: "resume" },
  { key: "x", action: "cancel" },
  { key: "d", action: "cancel" },
  { key: "a", action: "add" },
  { key: "i", action: "add" },
  { key: "n", action: "add" },
  { key: "?", action: "help" },
  { key: "Escape", action: "escape" },
  { key: "Enter", action: "submit" },
  { key: "q", action: "escape" },
];

interface UseVimNavigationOptions {
  itemCount: number;
  onAction: (action: Action, index: number) => void;
  enabled?: boolean;
}

export function useVimNavigation({
  itemCount,
  onAction,
  enabled = true,
}: UseVimNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pendingKey = useRef("");
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onActionRef = useRef(onAction);

  onActionRef.current = onAction;

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(i, itemCount - 1)),
    [itemCount],
  );

  useEffect(() => {
    setSelectedIndex((prev) => clamp(prev));
  }, [itemCount, clamp]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "g" && pendingKey.current === "g") {
        if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
        pendingKey.current = "";
        setSelectedIndex(0);
        onActionRef.current("selectFirst", 0);
        e.preventDefault();
        return;
      }

      if (e.key === "g" && pendingKey.current === "") {
        pendingKey.current = "g";
        pendingTimeout.current = setTimeout(() => {
          pendingKey.current = "";
        }, 500);
        e.preventDefault();
        return;
      }

      pendingKey.current = "";

      const match = DEFAULT_KEYMAP.find(
        (km) => km.key === e.key && (km.ctrl ? e.ctrlKey : !e.ctrlKey),
      );

      if (!match) return;

      e.preventDefault();
      setSelectedIndex((prev) => {
        let next = prev;
        switch (match.action) {
          case "moveUp":
            next = clamp(prev - 1);
            break;
          case "moveDown":
            next = clamp(prev + 1);
            break;
          case "selectFirst":
            next = 0;
            break;
          case "selectLast":
            next = itemCount - 1;
            break;
          default:
            onActionRef.current(match.action, prev);
            return prev;
        }
        onActionRef.current(match.action, next);
        return next;
      });
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, itemCount, clamp]);

  return { selectedIndex, setSelectedIndex };
}
