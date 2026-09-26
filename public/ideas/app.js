import { groups, ideas, references } from "./data.js";
import { renderScene } from "./scenes.js";

const $ = (selector) => document.querySelector(selector);
const byId = new Map(ideas.map((idea) => [idea.id, idea]));
const byReference = new Map(references.map((reference) => [reference.slug, reference]));
const orderedGroups = groups;
$("#verified-count").textContent = String(ideas.filter((idea) => idea.version === "v0.0.42").length);
$("#captured-count").textContent = `${ideas.length} captured interactions`;
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const number = (id) => String(ideas.findIndex((idea) => idea.id === id) + 1).padStart(2, "0");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const savedFromUrl = new URL(location.href).searchParams.get("conceptsV4");
const savedFromStorage = (() => { try { return localStorage.getItem("hyfrme-idea-picks-v4"); } catch { return null; } })();
const picks = new Set((savedFromUrl ?? savedFromStorage ?? "").split(",").map(Number).filter((id) => byId.has(id)));
const detailDialog = $("#detail-dialog");
const shortlistDialog = $("#shortlist-dialog");
const detailScene = $("#detail-scene");
let maxFrame = 119;
let filter = "all";
let activeIdea = null;
let clock = 0;
let detailAnimations = [];
let detailFrame = 0;
let detailPlaying = false;
let detailStartedAt = 0;
let detailTheme = "dark";

function replayScene(scene, force = false) {
  if (!scene || (reducedMotion.matches && !force)) return;
  scene.classList.remove("is-playing");
  scene.classList.toggle("force-motion", force);
  void scene.offsetWidth;
  scene.classList.add("is-playing");
  const video = scene.querySelector(".t3-motion");
  if (video) {
    video.currentTime = 0;
    video.play().catch(() => scene.classList.remove("is-playing"));
  }
}

function renderFilters() {
  const options = [{ id: "all", label: "All", count: ideas.length }, { id: "verified", label: "v0.0.42 checked", count: ideas.filter((idea) => idea.version === "v0.0.42").length }, ...orderedGroups.map((group) => ({ id: group.id, label: group.label, count: ideas.filter((idea) => idea.group === group.id).length })), { id: "saved", label: "Saved", count: picks.size }];
  $("#filters").innerHTML = options.map((option) => '<button type="button" class="filter" data-filter="' + option.id + '" aria-pressed="' + (filter === option.id) + '">' + escape(option.label) + ' <small>' + option.count + '</small></button>').join("");
}

function cardHtml(idea) {
  const saved = picks.has(idea.id);
  return '<article class="concept-card" data-idea="' + idea.id + '">' +
    '<div class="preview-wrap"><button class="preview-open" type="button" data-open="' + idea.id + '" aria-label="Open ' + escape(idea.title) + ' interaction"><span class="preview-frame">' + renderScene(idea) + '</span></button><button class="preview-replay" type="button" data-replay="' + idea.id + '" aria-label="Replay ' + escape(idea.title) + ' animation">Replay ↻</button></div>' +
    '<div class="concept-meta"><span>' + number(idea.id) + ' / T3 Code ' + (idea.block ? 'block' : 'reference') + '</span><span>' + idea.version + ' ' + idea.themes.join(' + ') + ' ' + idea.coverage + '</span></div>' +
    '<div class="concept-heading"><button type="button" data-open="' + idea.id + '">' + escape(idea.title) + '</button><button class="save-button" type="button" data-save="' + idea.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove" : "Save") + ' ' + escape(idea.title) + ' ' + (saved ? "from" : "to") + ' shortlist">' + (saved ? "✓" : "+") + '</button></div>' +
    '<p>' + escape(idea.line) + '</p></article>';
}

function renderIdeas() {
  const query = $("#search").value.trim().toLowerCase();
  const shown = ideas.filter((idea) => {
    if (filter === "saved" && !picks.has(idea.id)) return false;
    if (filter === "verified" && idea.version !== "v0.0.42") return false;
    if (filter !== "all" && filter !== "saved" && filter !== "verified" && idea.group !== filter) return false;
    if (!query) return true;
    const reference = byReference.get(idea.reference);
    return [idea.title, idea.line, ...idea.beats, idea.inputs, reference?.name].join(" ").toLowerCase().includes(query);
  });
  $("#empty-state").hidden = shown.length > 0;
  $("#idea-grid").innerHTML = orderedGroups.map((group) => {
    const entries = shown.filter((idea) => idea.group === group.id);
    if (!entries.length) return "";
    return '<section class="concept-group" aria-labelledby="heading-' + group.id + '"><div class="group-heading"><h2 id="heading-' + group.id + '">' + escape(group.label) + '</h2><p>' + escape(group.note) + '</p><span>' + entries.length + ' interactions</span></div><div class="concept-grid">' + entries.map(cardHtml).join("") + '</div></section>';
  }).join("");
}

function renderShortlist() {
  const selected = [...picks].sort((a, b) => a - b).map((id) => byId.get(id));
  $("#shortlist-items").innerHTML = selected.length
    ? selected.map((idea) => '<div class="shortlist-item"><span>' + number(idea.id) + '</span><button type="button" data-shortlist-open="' + idea.id + '">' + escape(idea.title) + '</button><button type="button" data-remove="' + idea.id + '" aria-label="Remove ' + escape(idea.title) + '">×</button></div>').join("")
    : '<p>No ideas saved yet.</p>';
  for (const id of ["copy-names", "copy-link", "clear-picks"]) $("#" + id).disabled = !selected.length;
}

function updateDetailSave() {
  const saved = picks.has(activeIdea.id);
  const button = $("#detail-save");
  button.textContent = saved ? "Saved to shortlist ✓" : "Save this idea +";
  button.setAttribute("aria-pressed", String(saved));
}

function updatePicks() {
  const ids = [...picks].sort((a, b) => a - b);
  const value = ids.join(",");
  try { localStorage.setItem("hyfrme-idea-picks-v4", value); } catch { /* Share links remain available. */ }
  const url = new URL(location.href);
  url.searchParams.delete("concepts");
  if (value) url.searchParams.set("conceptsV4", value);
  else url.searchParams.delete("conceptsV4");
  history.replaceState(null, "", url);
  $("#saved-count").textContent = String(ids.length);
  $("#dock-count").textContent = String(ids.length);
  $("#shortlist-dock").hidden = ids.length === 0;
  document.querySelectorAll("[data-save]").forEach((button) => {
    const idea = byId.get(Number(button.dataset.save));
    const saved = picks.has(idea.id);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", (saved ? "Remove " : "Save ") + idea.title + (saved ? " from" : " to") + " shortlist");
    button.textContent = saved ? "✓" : "+";
  });
  if (activeIdea) updateDetailSave();
  renderFilters();
  renderShortlist();
  if (filter === "saved") renderIdeas();
}

function togglePick(id) {
  if (picks.has(id)) picks.delete(id);
  else picks.add(id);
  updatePicks();
}

function updateTransport(frame) {
  const safeFrame = Math.max(0, Math.min(maxFrame, Math.round(frame)));
  $("#detail-range").value = String(safeFrame);
  $("#detail-time").textContent = String(safeFrame).padStart(3, "0") + " / " + String(maxFrame).padStart(3, "0");
  $("#detail-play").textContent = detailPlaying ? "Pause" : safeFrame >= maxFrame ? "Replay" : "Play";
}

function tick() {
  if (!detailDialog.open || !detailPlaying) return;
  const video = detailScene.querySelector(".t3-motion");
  if (video) {
    detailFrame = Math.min(maxFrame, Math.round(video.currentTime * 30));
    if (video.ended || video.paused) detailPlaying = false;
    updateTransport(detailFrame);
    if (detailPlaying) clock = setTimeout(tick, 1000 / 30);
    return;
  }
  const elapsed = Math.min(maxFrame * 1000 / 30, performance.now() - detailStartedAt);
  detailFrame = Math.round(elapsed * 30 / 1000);
  for (const animation of detailAnimations) animation.currentTime = elapsed;
  if (detailFrame >= maxFrame) detailPlaying = false;
  updateTransport(detailFrame);
  if (detailPlaying) clock = setTimeout(tick, 1000 / 30);
}

function seekFrame(frame) {
  clearTimeout(clock);
  detailPlaying = false;
  const safeFrame = Math.max(0, Math.min(maxFrame, Math.round(frame)));
  const video = detailScene.querySelector(".t3-motion");
  if (video) {
    video.pause();
    video.currentTime = safeFrame / 30;
    detailFrame = safeFrame;
    updateTransport(safeFrame);
    return;
  }
  const scene = detailScene.querySelector(".concept-scene");
  if (!detailAnimations.length) {
    replayScene(scene, true);
    detailAnimations = scene.getAnimations({ subtree: true });
  }
  detailFrame = safeFrame;
  for (const animation of detailAnimations) {
    animation.pause();
    animation.currentTime = safeFrame * 1000 / 30;
  }
  updateTransport(safeFrame);
}

function playDetail() {
  if (detailFrame >= maxFrame) seekFrame(0);
  const video = detailScene.querySelector(".t3-motion");
  if (video) {
    detailPlaying = true;
    video.play().catch(() => { detailPlaying = false; updateTransport(detailFrame); });
    clock = setTimeout(tick, 1000 / 30);
    updateTransport(detailFrame);
    return;
  }
  if (!detailAnimations.length) seekFrame(detailFrame);
  detailPlaying = true;
  detailStartedAt = performance.now() - detailFrame * 1000 / 30;
  clock = setTimeout(tick, 1000 / 30);
  updateTransport(detailFrame);
}

function showDetailScene(idea) {
  clearTimeout(clock);
  detailPlaying = false;
  detailScene.querySelector(".t3-motion")?.pause();
  detailAnimations.forEach((animation) => animation.cancel());
  detailAnimations = [];
  detailFrame = 0;
  maxFrame = 119;
  detailScene.innerHTML = renderScene(idea, detailTheme);
  $("#detail-disclosure-intro").textContent = "Recorded directly in T3 Code " + idea.version + " at 1200 × 659. This preview shows " + detailTheme + " mode; checked themes: " + idea.themes.join(" and ") + ". " + idea.capture + " Source: ";
  $("#detail-themes").querySelectorAll("[data-detail-theme]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.detailTheme === detailTheme));
  });
  $("#detail-range").max = String(maxFrame);
  const video = detailScene.querySelector(".t3-motion");
  if (video) {
    detailScene.querySelector(".t3-capture").classList.add("show-video");
    updateTransport(0);
    video.preload = "auto";
    video.addEventListener("loadedmetadata", () => {
      if (!detailDialog.open || activeIdea?.id !== idea.id || !detailScene.contains(video)) return;
      maxFrame = Math.max(1, Math.floor(video.duration * 30) - 1);
      $("#detail-range").max = String(maxFrame);
      seekFrame(0);
      if (!reducedMotion.matches) playDetail();
    }, { once: true });
    video.load();
    return;
  }
  seekFrame(0);
  if (!reducedMotion.matches) playDetail();
}

function openIdea(id) {
  const idea = byId.get(id);
  if (!idea) return;
  activeIdea = idea;
  detailTheme = "dark";
  const reference = byReference.get(idea.reference);
  const group = groups.find((entry) => entry.id === idea.group);
  $("#detail-index").textContent = "Reference " + number(id) + " / " + ideas.length;
  $("#detail-group").textContent = group.label;
  $("#detail-title").textContent = idea.title;
  $("#detail-line").textContent = idea.line;
  $("#detail-beats").innerHTML = idea.beats.map((beat) => '<li>' + escape(beat) + '</li>').join("");
  $("#detail-inputs-label").textContent = idea.block ? "Customize in HyperFrames" : "Could customize";
  $("#detail-inputs").textContent = idea.inputs;
  $("#detail-reference-link").href = "https://github.com/pingdotgg/t3code/tree/" + idea.version;
  $("#detail-reference-link").textContent = reference.name + " (" + reference.source + ")";
  const sourceLink = $("#detail-ui-source");
  sourceLink.hidden = !idea.source;
  if (idea.source) sourceLink.href = idea.source;
  const installLink = $("#detail-install-link");
  installLink.hidden = !idea.block;
  if (idea.block) installLink.href = "/components/" + idea.block;
  installLink.textContent = "Open " + idea.version + " HyperFrames block ↗";
  $("#detail-themes").hidden = !idea.themes.includes("light");
  updateDetailSave();
  if (shortlistDialog.open) shortlistDialog.close();
  detailDialog.showModal();
  showDetailScene(idea);
}

async function copy(value, message) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const success = document.execCommand("copy");
    input.remove();
    if (!success) {
      $("#copy-status").textContent = "Copy failed. Select the names in your shortlist instead.";
      return;
    }
  }
  $("#copy-status").textContent = message;
}

$("#idea-grid").addEventListener("pointerover", (event) => {
  const card = event.target.closest(".concept-card");
  if (card && event.pointerType !== "touch" && !card.contains(event.relatedTarget)) replayScene(card.querySelector(".concept-scene"));
});
$("#idea-grid").addEventListener("pointerout", (event) => {
  const card = event.target.closest(".concept-card");
  if (!card || card.contains(event.relatedTarget)) return;
  const scene = card.querySelector(".t3-capture");
  if (!scene) return;
  scene.querySelector(".t3-motion").pause();
  scene.classList.remove("is-playing");
});
$("#idea-grid").addEventListener("focusin", (event) => {
  const card = event.target.closest(".concept-card");
  if (card) replayScene(card.querySelector(".concept-scene"));
});
$("#idea-grid").addEventListener("click", (event) => {
  const save = event.target.closest("[data-save]");
  if (save) return togglePick(Number(save.dataset.save));
  const replay = event.target.closest("[data-replay]");
  if (replay) return replayScene(replay.closest(".concept-card").querySelector(".concept-scene"), true);
  const open = event.target.closest("[data-open]");
  if (open) openIdea(Number(open.dataset.open));
});
$("#filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  renderFilters();
  renderIdeas();
});
$("#search").addEventListener("input", renderIdeas);
$("#header-shortlist").addEventListener("click", () => shortlistDialog.showModal());
$("#dock-open").addEventListener("click", () => shortlistDialog.showModal());
$("#shortlist-close").addEventListener("click", () => shortlistDialog.close());
$("#shortlist-items").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove]");
  if (remove) return togglePick(Number(remove.dataset.remove));
  const open = event.target.closest("[data-shortlist-open]");
  if (open) openIdea(Number(open.dataset.shortlistOpen));
});
$("#copy-names").addEventListener("click", () => {
  const names = [...picks].sort((a, b) => a - b).map((id) => number(id) + " " + byId.get(id).title);
  copy(names.join("\n"), names.length + " names copied.");
});
$("#copy-link").addEventListener("click", () => copy(location.href, "Link copied."));
$("#clear-picks").addEventListener("click", () => { picks.clear(); updatePicks(); });
$("#detail-close").addEventListener("click", () => detailDialog.close());
$("#detail-themes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-detail-theme]");
  if (!button || !activeIdea || button.dataset.detailTheme === detailTheme) return;
  detailTheme = button.dataset.detailTheme;
  showDetailScene(activeIdea);
});
$("#detail-save").addEventListener("click", () => togglePick(activeIdea.id));
$("#detail-play").addEventListener("click", () => {
  if (detailPlaying) {
    detailPlaying = false;
    clearTimeout(clock);
    detailScene.querySelector(".t3-motion")?.pause();
    updateTransport(detailFrame);
    return;
  }
  playDetail();
});
$("#detail-back").addEventListener("click", () => seekFrame(Number($("#detail-range").value) - 1));
$("#detail-forward").addEventListener("click", () => seekFrame(Number($("#detail-range").value) + 1));
$("#detail-range").addEventListener("input", (event) => seekFrame(Number(event.target.value)));
detailDialog.addEventListener("close", () => {
  clearTimeout(clock);
  detailPlaying = false;
  detailScene.querySelector(".t3-motion")?.pause();
  detailAnimations.forEach((animation) => animation.cancel());
  detailAnimations = [];
  activeIdea = null;
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") return;
  document.getAnimations().forEach((animation) => animation.pause());
  document.querySelectorAll("video.t3-motion").forEach((video) => video.pause());
  clearTimeout(clock);
  detailPlaying = false;
});
document.addEventListener("keydown", (event) => {
  if (!detailDialog.open || event.target instanceof HTMLInputElement) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    seekFrame(Number($("#detail-range").value) + (event.key === "ArrowLeft" ? -1 : 1));
  }
});

renderFilters();
renderIdeas();
updatePicks();
