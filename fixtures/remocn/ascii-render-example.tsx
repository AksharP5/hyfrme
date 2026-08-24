"use client";

import { CanvasSceneA } from "@/components/docs/examples/canvas-scenes";
import {
  AsciiRender,
  type AsciiRenderProps,
} from "@/registry/remocn/ascii-render";
import { interpolate, useCurrentFrame } from "remotion";

const DEFAULT_GLYPH_SIZE = 26;

export function HyfrmeAsciiRenderExampleScene({
  glyphSize = DEFAULT_GLYPH_SIZE,
  charset = " .:-=+*#%@",
  colored = false,
  ink = "#9dff9d",
  intensity = 1,
}: AsciiRenderProps) {
  const frame = useCurrentFrame();
  const animatedIntensity = interpolate(
    frame,
    [0, 34, 76, 96],
    [intensity, 0, 0, intensity],
  );
  const glyphScale = glyphSize / DEFAULT_GLYPH_SIZE;
  const animatedGlyphSize = interpolate(
    frame,
    [0, 34, 76, 96],
    [44 * glyphScale, 20 * glyphScale, 20 * glyphScale, 44 * glyphScale],
  );

  return (
    <AsciiRender
      glyphSize={animatedGlyphSize}
      charset={charset}
      colored={colored}
      ink={ink}
      intensity={animatedIntensity}
    >
      <CanvasSceneA />
    </AsciiRender>
  );
}
