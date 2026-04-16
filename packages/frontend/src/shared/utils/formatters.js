export function toReadableDate(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(parsed));
}

export function toRelativeTime(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "instante indefinido";

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.max(1, Math.floor(Math.abs(diffMs) / 60000));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} d`;
}

export function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
