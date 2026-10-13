import { resolve } from "node:path";

// Hyfrme's caption paging implementation. No Remotion package is bundled.
export function createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds,
  breakOnSilenceAfterMilliseconds,
}) {
  const pages = [];
  let page = { text: "", startMs: 0, tokens: [] };
  let endMs = 0;

  const finishPage = () => {
    if (!page.text) return;
    pages.push({
      ...page,
      text: page.text.replace(/\n$/, ""),
      durationMs: 0,
    });
    page = { text: "", startMs: page.startMs, tokens: [] };
  };

  for (const caption of captions) {
    const overWindow = endMs - page.startMs > combineTokensWithinMilliseconds;
    const afterSilence =
      breakOnSilenceAfterMilliseconds !== undefined &&
      page.text !== "" &&
      caption.startMs - endMs >= breakOnSilenceAfterMilliseconds;
    // Sub-word tokens stay together even when they cross the paging window.
    if (caption.text.startsWith(" ") && (overWindow || afterSilence)) {
      finishPage();
    }

    if (!page.text) page.startMs = caption.startMs;
    page.text = (page.text + caption.text).trimStart();
    if (caption.text.trim()) {
      page.tokens.push({
        text: page.tokens.length ? caption.text : page.text,
        fromMs: caption.startMs,
        toMs: caption.endMs,
        ...(caption.pageBreakAfter ? { pageBreakAfter: true } : {}),
      });
    }
    endMs = caption.endMs;
    if (caption.pageBreakAfter) finishPage();
  }
  finishPage();

  for (let index = 0; index < pages.length; index += 1) {
    pages[index].durationMs =
      (pages[index + 1]?.startMs ?? endMs) - pages[index].startMs;
  }
  return { pages };
}

export const captionRuntimeSource = `export ${createTikTokStyleCaptions.toString()}`;

export function createRemocnCaptionsPlugin(sourceRoot) {
  return {
    name: "hyfrme-remocn-captions",
    setup(buildApi) {
      buildApi.onResolve({ filter: /^@remotion\/captions$/ }, () => ({
        path: "caption-pages",
        namespace: "hyfrme-captions",
      }));
      buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-captions" }, () => ({
        contents: captionRuntimeSource,
        loader: "js",
      }));
      buildApi.onResolve({ filter: /^@\/lib\/remocn\/caption-core$/ }, () => ({
        path: resolve(sourceRoot, "registry/remocn/caption-core/index.ts"),
      }));
    },
  };
}
