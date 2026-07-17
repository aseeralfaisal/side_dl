const K = 1024;
const SIZES = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(K));
  return `${(bytes / Math.pow(K, i)).toFixed(1)} ${SIZES[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return "\u2014 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}
