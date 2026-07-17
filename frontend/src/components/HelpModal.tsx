import { useEscapeKey } from "../hooks/useEscapeKey";
import { Modal } from "./Modal";

interface Props {
  onClose: () => void;
}

const KEYBINDINGS = [
  { keys: "j / k", desc: "move down / up" },
  { keys: "h / l", desc: "switch tabs" },
  { keys: "gg / G", desc: "go to top / bottom" },
  { keys: "a / i / n", desc: "add new download" },
  { keys: "p", desc: "pause selected" },
  { keys: "r", desc: "resume selected" },
  { keys: "x / d", desc: "cancel selected" },
  { keys: "?", desc: "toggle this help" },
  { keys: "esc / q", desc: "close / deselect" },
  { keys: "enter", desc: "confirm action" },
];

export function HelpModal({ onClose }: Props) {
  useEscapeKey(onClose);

  return (
    <Modal onClose={onClose} className="modal-help">
      <div className="modal-header">
        <span className="modal-title">keybindings</span>
        <span className="modal-hint">esc / q to close</span>
      </div>
      <div className="help-grid">
        <div className="help-section">
          <div className="help-section-title">navigation</div>
          {KEYBINDINGS.slice(0, 3).map((kb) => (
            <div key={kb.keys} className="help-row">
              <kbd className="help-key">{kb.keys}</kbd>
              <span className="help-desc">{kb.desc}</span>
            </div>
          ))}
        </div>
        <div className="help-section">
          <div className="help-section-title">actions</div>
          {KEYBINDINGS.slice(3, 7).map((kb) => (
            <div key={kb.keys} className="help-row">
              <kbd className="help-key">{kb.keys}</kbd>
              <span className="help-desc">{kb.desc}</span>
            </div>
          ))}
        </div>
        <div className="help-section">
          <div className="help-section-title">general</div>
          {KEYBINDINGS.slice(7).map((kb) => (
            <div key={kb.keys} className="help-row">
              <kbd className="help-key">{kb.keys}</kbd>
              <span className="help-desc">{kb.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
