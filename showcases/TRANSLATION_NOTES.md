# Showcase translation notes

The following source-only constructs are removed before the HyperFrames
runtime is bundled:

- Paper shader components use React state only to hold Remotion's
  `delayRender()` readiness handle. Hyfrme removes that handle because
  HyperFrames owns frame readiness and deterministic seeking.
- The shadcn showcase's `useIsMobile()` hook is fixed to `false` for the
  canonical 1280×720 desktop fixture. The public reference render takes the
  same branch.
- Videorc's two remote GitHub image URLs are replaced with local assets under
  `showcases/assets/demo/`.
- Google Fonts imports are replaced with bundled, licensed local fonts.

The generated runtimes contain React and ReactDOM, plus the translated
composition source and Paper shader runtime. They do not contain Remotion.

The public `Remocn/remocn-collections` repository does not currently declare a
repository license. The source pins and attribution are therefore kept
explicit for review before Hyfrme treats these showcase translations as
redistributable release artifacts.
