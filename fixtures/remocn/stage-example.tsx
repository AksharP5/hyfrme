"use client";

import { Img, staticFile } from "remotion";
import { Stage } from "@/registry/remocn/stage";
import {
  STAGE_PRESETS,
  type StageExampleProps,
} from "@/components/docs/examples/stage-example";

export interface HyfrmeStageExampleProps extends StageExampleProps {
  imageUrl?: string;
}

export function HyfrmeStageExampleScene({
  preset = "smooth-descent",
  imageUrl = staticFile("stage-remocn-components.webp"),
  shake = 0,
  seed = "remocn-smooth-descent",
  ...stageProps
}: HyfrmeStageExampleProps) {
  return (
    <Stage
      {...stageProps}
      contentSize={{ width: 1265, height: 10022 }}
      moves={STAGE_PRESETS[preset] ?? STAGE_PRESETS["smooth-descent"]}
      shake={shake}
      seed={seed}
    >
      <Img
        src={imageUrl}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </Stage>
  );
}
