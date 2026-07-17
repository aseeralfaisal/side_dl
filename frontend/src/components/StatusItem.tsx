interface Props {
  icon: string;
  count: number;
  label: string;
}

export function StatusItem({ icon, count, label }: Props) {
  return (
    <span className="status-item">
      <svg viewBox="0 0 24 24" width="12" height="12" className="status-icon">
        <path d={icon} fill="currentColor" />
      </svg>
      {count} {label}
    </span>
  );
}
