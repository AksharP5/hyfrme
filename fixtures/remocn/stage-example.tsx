"use client";

import { Img } from "remotion";
import { Stage, type StageProps } from "@/registry/remocn/stage";
import {
  STAGE_PRESETS,
  type StagePreset,
} from "@/components/docs/examples/stage-example";

export interface HyfrmeStageExampleProps extends Omit<
  StageProps,
  "children" | "contentSize" | "moves"
> {
  preset?: StagePreset;
  imageUrl?: string;
}

export function HyfrmeStageExampleScene({
  preset = "smooth-descent",
  imageUrl = "../assets/stage-remocn-components.webp",
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
