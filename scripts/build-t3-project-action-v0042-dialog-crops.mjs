import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const root =
  ".work/full-parity-audit/project-action-diagnosis/dialog-crop-prototype";
await mkdir(root, { recursive: true });
const reports = [];
const source = "assets/t3-code/v0.0.42";
for (const theme of ["dark", "light"]) {
  const fixturePath =
    source + "/project-action-v0042-" + theme + "-fixture.json";
  const fixtureBytes = await readFile(fixturePath);
  const fixture = JSON.parse(fixtureBytes);
  const video =
    fixture.reference ??
    "parity/t3-project-action-v0042-" + theme + "-reference.mkv";
  const out = resolve(root, theme);
  await mkdir(out, { recursive: true });
  const filter = "trim=start_frame=20:end_frame=100,crop=512:627:344:16";
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    video,
    "-vf",
    filter,
    "-start_number",
    "0",
    out + "/frame-%04d.png",
  ]);
  const lines = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      video,
      "-vf",
      filter,
      "-pix_fmt",
      "rgba",
      "-f",
      "framemd5",
      "-hash",
      "SHA256",
      "-",
    ],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("#"));
  const unique = [],
    rows = [],
    indices = new Map();
  for (let i = 0; i < lines.length; i++) {
    const rgbaSha256 = lines[i].split(",").at(-1).trim();
    const file = "frame-" + String(i).padStart(4, "0") + ".png",
      data = await readFile(out + "/" + file);
    let index = indices.get(rgbaSha256);
    if (index === undefined) {
      index = unique.length;
      indices.set(rgbaSha256, index);
      unique.push({
        index,
        originalFrame: i + 20,
        file,
        pngSha256: hash(data),
        rgbaSha256,
        encodedBytes: data.length,
      });
    }
    rows.push({
      frame: i + 20,
      imageIndex: index,
      rgbaSha256,
      pngSha256: hash(data),
    });
  }
  if (rows.length !== 80) throw Error("Expected80dialog crops");
  const pngHashes = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-start_number",
      "0",
      "-i",
      out + "/frame-%04d.png",
      "-pix_fmt",
      "rgba",
      "-f",
      "framemd5",
      "-hash",
      "SHA256",
      "-",
    ],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => x.split(",").at(-1).trim());
  if (pngHashes.some((h, i) => h !== rows[i].rgbaSha256))
    throw Error("DerivedPNGpixels differ");
  for (const image of unique) {
    const asset =
      "project-action-v0042-" +
      theme +
      "-dialog-frame-" +
      String(image.index).padStart(2, "0") +
      ".png";
    await copyFile(out + "/" + image.file, source + "/" + asset);
    image.file = asset;
  }
  if (fixture.referenceSha256 !== hash(await readFile(video)))
    throw Error("Pinned source video differs from fixture");
  reports.push({
    theme,
    sourceFixture: fixturePath,
    sourceFixtureSha256: hash(fixtureBytes),
    frameImageIndices: Array.from({ length: 120 }, (_, frame) =>
      frame >= 20 && frame < 100 ? rows[frame - 20].imageIndex : null,
    ),
    sourceVideo: video,
    sourceVideoSha256: hash(await readFile(video)),
    crop: { x: 344, y: 16, width: 512, height: 627 },
    startFrame: 20,
    endFrame: 99,
    frames: rows,
    uniqueImages: unique,
    decodedBytes: unique.length * 512 * 627 * 4,
    encodedBytes: unique.reduce((n, r) => n + r.encodedBytes, 0),
    everyDerivedPngRgbaExact: true,
  });
}
await writeFile(
  source + "/project-action-v0042-dialog-crops.json",
  JSON.stringify(
    {
      classification:
        "Deduplicated dialog crops decoded from one whole readiness-corrected immutable native FFV1 per theme; observed native dialog raster variation is preserved without frame mixing",
      reports,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    reports.map(
      ({
        theme,
        uniqueImages,
        decodedBytes,
        encodedBytes,
        everyDerivedPngRgbaExact,
      }) => ({
        theme,
        uniqueImages: uniqueImages.length,
        decodedBytes,
        encodedBytes,
        everyDerivedPngRgbaExact,
      }),
    ),
  ),
);
