interface IconProps {
  path: string;
  size?: number;
  className?: string;
}

export function Icon({ path, size = 16, className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}
