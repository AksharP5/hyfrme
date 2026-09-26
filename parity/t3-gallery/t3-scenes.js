const frame = (id, step) =>
  `<img class="t3-shot t3-shot-${step}" src="./t3-frames/${id}-${step}.webp" width="1200" height="659" loading="lazy" decoding="async" alt="">`;

export function renderT3Scene(idea, theme = "dark") {
  const steps = ["a", "b", "c"];
  const light = theme === "light" && idea.themes.includes("light") && idea.block;
  const shots = light ? "" : steps.map((step) => frame(idea.id, step)).join("");
  const lightName = idea.previewVariant === "settingsEnabled200" ? "reference-settings-enabled-light.mp4" : "reference-light.mp4";
  const source = light ? `/previews/${idea.block}/${lightName}` : `./t3-clips/${idea.id}.mp4`;
  const poster = light ? "" : ` poster="./t3-frames/${idea.id}-a.webp"`;
  return `<div class="concept-scene t3-capture${light ? " is-light" : ""}" data-steps="${steps.length}" data-capture-id="${idea.id}">${shots}<video class="t3-motion" src="${source}"${poster} preload="none" muted playsinline aria-hidden="true"></video></div>`;
}
