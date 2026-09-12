export function frameRateArgument(fps) {
  if (Number.isInteger(fps) && fps > 0) return String(fps);
  const numerator = Math.round(fps * 1001);
  if (
    Number.isSafeInteger(numerator) &&
    numerator > 0 &&
    numerator / 1001 === fps
  )
    return `${numerator}/1001`;
  throw new Error(`Unsupported frame rate: ${fps}`);
}
