export function decodeSlug(encoded: string) {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}
