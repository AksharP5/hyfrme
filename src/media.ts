import manifest from "./generated/media.json";

const media: Record<string, string> = manifest;

export function mediaUrl(path: string) {
  if (import.meta.env.DEV) return path;
  const url = media[path];
  if (!url) throw new Error(`Missing media URL: ${path}`);
  return url;
}
