import showcaseData from "../catalog/showcases.json";

export type Showcase = {
  slug: string;
  title: string;
  durationInFrames: number;
  sourceCommit: string;
  author: {
    name: string;
    url: string;
  };
  description: string;
  components: string[];
  fps: number;
  width: number;
  height: number;
  duration: number;
  sourcePath: string;
  previewUrl: string;
  posterUrl: string;
  originUrl: string;
  sourceUrl: string;
  meanSsim: number | null;
};

export const showcases = showcaseData as Showcase[];
