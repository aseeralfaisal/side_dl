import { memo } from "react";
import { formatSpeed } from "../utils/format";
import { ICON_PAUSE, ICON_PLAY, ICON_CHECK, ICON_KEYBOARD } from "../utils/icons";
import { StatusItem } from "./StatusItem";
import { Icon } from "./Icon";

interface Props {
  active: number;
  paused: number;
  completed: number;
  total: number;
  totalSpeed: number;
  onHelpClick: () => void;
}

export const StatusBar = memo(function StatusBar({ active, paused, completed, total, totalSpeed, onHelpClick }: Props) {

  return (
    <div className="status-bar">
      <div className="status-left">
        <StatusItem icon={ICON_PAUSE} count={active} label="Active" />
        <StatusItem icon={ICON_PLAY} count={paused} label="Paused" />
        <StatusItem icon={ICON_CHECK} count={completed} label="Done" />
        <span className="status-item dim">
          {total} Total
        </span>
      </div>
      <div className="status-right">
        {active > 0 && (
          <span className="status-speed">{formatSpeed(totalSpeed)}</span>
        )}
        <span className="status-help" onClick={onHelpClick}>
          <Icon path={ICON_KEYBOARD} size={12} className="status-icon" />
          Keys
        </span>
      </div>
    </div>
  );
});
