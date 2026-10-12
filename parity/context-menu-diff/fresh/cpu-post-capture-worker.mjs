import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, stat, statfs, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertExactFrameHashes, hashBlockFiles } from '../../../../../scripts/parity-evidence.mjs';
import { assertExactCompiledParity } from '../../../../../scripts/compiled-parity.mjs';
import { assertHardwareGpuProbe, browserGpuProbeEvidence } from '../../../../../scripts/browser-gpu-evidence.mjs';

const root = resolve(import.meta.dirname, '../../../../..');
const context = resolve(import.meta.dirname, '..');
const output = resolve(context, 'post-capture-completion-v2');
const grantPath = resolve(import.meta.dirname, 'execution-grant.json');
const approvedPlanSha256 = 'b5b5a5d24a1bebe3b4bcd875b6b84ee2cfa663d95731c9ca7bd9aa7527a40366';
const firstFailureSha256 = '0d5974b8177b62499f3ab7d6031efd96dd2a054d1946bba0e1ffe6861ed95eb3';
const fingerprint = '75a633d5967b27af0893937d02902d55c048520ad36c599ac1e5aa05ca0fb4f8';
const maxOutputBytes = 100 * 1024 ** 2;
const reserveBytes = 2 * 1024 ** 3;
const sdk = '/home/akshar/.npm/_npx/917800652df20acb/node_modules/hyperframes';
const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const fileHash = async path => digest(await readFile(path));
const workerSha256 = await fileHash(import.meta.filename);

assert.deepEqual(process.argv.slice(2), ['--run'], 'Execution requires --run and a separate root execution-grant.json');
assert.equal(await fileHash(resolve(import.meta.dirname, 'completion-plan.json')), approvedPlanSha256);
const completionPlan = await load(resolve(import.meta.dirname, 'completion-plan.json'));
const v1 = resolve(context, 'post-capture-plan-v1');
const partial = completionPlan.activeOnlyDerivedChecksum;
const grant = await load(grantPath);
assert.deepEqual(grant, {
  authorizedBy: '/root',
  scope: 'Context-only corrected v2 CPU post-capture completion of preserved first run',
  workerSha256,
  completionPlanSha256: approvedPlanSha256,
  executeOnce: true,
  newCaptureCheckRenderCount: 0,
  publicCanonicalWrites: false,
  coordinatedWithMainCapture: true,
  maxOutputBytes,
  reserveBytes,
});
const grantSha256 = await fileHash(grantPath);
const originalHandoffPath = resolve(context, '../cpu-handoff.json');
assert.equal(await fileHash(originalHandoffPath), 'd990c3f9d0f7ed21c43a000af780222a9152ddfd4337a19726a1c89ab159b430');
const originalJob = (await load(originalHandoffPath)).jobs.find(job => job.slug === 'context-menu');
assert.equal(await fileHash(resolve(context, 'prepared.json')), originalJob.preparedReceiptSha256);
assert.equal(await fileHash(resolve(context, 'primitive-plan.json')), originalJob.planSha256);
const prepared = await load(resolve(context, 'prepared.json'));
const job = await load(resolve(context, 'primitive-plan.json'));
assert.equal(await fileHash(resolve(context, 'after-generic-first-output-review.json')), completionPlan.firstImmutableInputs.rawTreeManifestReceiptSha256);
const firstOutput = await load(resolve(context, 'after-generic-first-output-review.json'));
assert.equal(job.slug, 'context-menu');
assert.equal(job.canonicalFrames, 135);
assert.deepEqual(job.repeatFrames, [0, 33, 67, 101, 134]);
assert.equal(firstOutput.freshRuns.length, 1);
const freshRecord = firstOutput.freshRuns[0];
assert.equal(freshRecord.name, 'run-5xShI6');
const raw = resolve(root, freshRecord.archive);
const activeRaw = resolve(root, '.work/verify-remocn-fresh/context-menu', freshRecord.name);
assert.equal(await fileHash(resolve(raw, 'proof/inputs.json')), completionPlan.firstImmutableInputs.capturedInputsSha256);
const proofInputs = await load(resolve(raw, 'proof/inputs.json'));
const { fingerprint: recordedFingerprint, installedHashes, compiledHashes, nativeBundleHashes, nativeRootSha256, ...capturedInputs } = proofInputs;
assert.equal(recordedFingerprint, fingerprint);
assert.equal(digest(JSON.stringify(capturedInputs)), fingerprint);
assert.equal(prepared.generic.fingerprint, fingerprint);
assert.equal(prepared.guardedInputFiles, 389);
Object.assign(process.env, job.environment);
const { referenceFingerprint } = await import(pathToFileURL(resolve(root, 'scripts/remocn-lossless-reference.mjs')).href);
const { freshCaptureProfile } = await import(pathToFileURL(resolve(root, 'scripts/remocn-fresh-capture.mjs')).href);
const sharp = createRequire(resolve(sdk, 'package.json'))('sharp');
sharp.concurrency(1);
const fixture = job.entry.fixture;
const shape = { width: fixture.width, height: fixture.height, frameCount: 135 };
assert.deepEqual(fixture, { width: 1280, height: 720, fps: 30, durationInFrames: 135, props: {}, background: 'oklch(1 0 0)' });
const debugNames = await readdir(resolve(raw, '.debug'));
assert.equal(debugNames.length, 1);
const derived = {
  installed: resolve(context, 'after-generic/producer-work/installed'),
  compiled: resolve(raw, '.debug', debugNames[0], 'compiled'),
  nativeBundle: resolve(context, 'after-generic/native-project/bundle'),
  nativeRoot: resolve(context, 'after-generic/native-project/root.tsx'),
};

async function treeHashes(path) {
  const hashes = {};
  async function visit(relative = '') {
    for (const entry of (await readdir(resolve(path, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) hashes[child] = await fileHash(resolve(path, child));
      else throw Error(`Non-regular proof entry: ${path}/${child}`);
    }
  }
  await visit();
  return hashes;
}

async function assertArchives(archives, currentOriginal = false) {
  for (const item of archives.filter(item => !item.missing)) {
    const preserved = resolve(root, item.archive);
    const hashes = item.type === 'file' ? { '': await fileHash(preserved) } : await treeHashes(preserved);
    assert.deepEqual(hashes, item.filesSha256, `Protected archive changed: ${item.archive}`);
    if (currentOriginal) {
      const active = resolve(root, item.path);
      assert.deepEqual(item.type === 'file' ? { '': await fileHash(active) } : await treeHashes(active), item.filesSha256, `Original active tree changed: ${item.path}`);
    }
  }
}

async function inputState() {
  const manifest = await load(resolve(root, 'registry/blocks/context-menu/registry-item.json'));
  const source = resolve(root, job.environment.REMOCN_SOURCE);
  return {
    referenceFingerprint: await referenceFingerprint(job.entry),
    filesSha256: await hashBlockFiles(resolve(root, 'registry/blocks/context-menu'), manifest),
    sourceHashes: Object.fromEntries(await Promise.all([...new Set([job.entry.origin.source, job.entry.origin.config, job.entry.origin.entry].filter(path => typeof path === 'string'))].map(async path => [path, await fileHash(resolve(source, path))]))),
    browserSha256: await fileHash(job.environment.HYFRME_BROWSER_EXECUTABLE),
    verifierSha256: await fileHash(resolve(root, 'scripts/verify-remocn-fresh.mjs')),
    captureHelperSha256: await fileHash(resolve(root, 'scripts/remocn-fresh-capture.mjs')),
    evidenceHelperSha256: await fileHash(resolve(root, 'scripts/parity-evidence.mjs')),
    gpuEvidenceHelperSha256: await fileHash(resolve(root, 'scripts/browser-gpu-evidence.mjs')),
    acceptanceHelperSha256: await fileHash(resolve(root, 'scripts/compiled-parity.mjs')),
    sequentialVerifierSha256: await fileHash(resolve(root, 'scripts/verify-snapcn-ports.mjs')),
    sequentialWrapperSha256: await fileHash(resolve(root, 'scripts/verify-text-ports.mjs')),
    cliInstallerSha256: await fileHash(resolve(root, 'cli/bin/hyfrme.mjs')),
    sourceCheckExceptions: (await load(resolve(root, 'catalog/remocn-check-exceptions.json'))).filter(exception => exception.slug === 'context-menu' && exception.origin.commit === job.entry.origin.commit && exception.origin.source === job.entry.origin.source),
    sdkHashes: { 'package.json': await fileHash(resolve(sdk, 'package.json')), 'bin/hyperframes.mjs': await fileHash(resolve(sdk, 'bin/hyperframes.mjs')), dist: await treeHashes(resolve(sdk, 'dist')) },
    captureProfile: freshCaptureProfile(true),
    proofPaths: capturedInputs.proofPaths,
    repeatFrames: job.repeatFrames,
  };
}

async function assertActiveFirstTree() {
  const activeHashes = await treeHashes(activeRaw);
  const { [partial.path]: activeChecksumHash, ...remainingActive } = activeHashes;
  const { [partial.path]: firstChecksumHash, ...remainingFirst } = freshRecord.filesSha256;
  assert.equal(firstChecksumHash, digest(''), 'First checksum manifest must remain the empty original');
  assert.equal(activeChecksumHash, partial.sha256, 'Pinned partial shutdown checksum changed');
  assert.deepEqual(remainingActive, remainingFirst, 'A remaining active first capture entry changed');
  const path = resolve(activeRaw, partial.path);
  const metadata = await stat(path, { bigint: true });
  assert.equal(metadata.mtimeNs.toString(), partial.mtimeNs, 'Pinned partial checksum timestamp changed');
  assert.equal(Number(metadata.size), partial.bytes);
  assert.equal((await readFile(resolve(raw, partial.path))).length, 0, 'Immutable archived first checksum must stay empty');
  const rows = (await readFile(path, 'utf8')).split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').map(value => value.trim()));
  const reference = await hashRows(resolve(raw, 'proof/reference-rgba.framemd5'));
  assert.equal(rows.length, partial.rowCount);
  for (const [frame, row] of rows.entries()) {
    assert.equal(row.length, 6);
    assert.equal(Number(row[2]), frame);
    assert.equal(Number(row[4]), 1280 * 720 * 4);
    assert.equal(row[5], reference[frame], 'Partial shutdown hash must equal the first source prefix');
  }
  const rootReviewText = await readFile(resolve(v1, 'root-partial-output-review.json'), 'utf8');
  assert.equal(rootReviewText.match(/"activeDerivedChecksumMtimeNs":\s*(\d+)/)?.[1], partial.mtimeNs);
}

async function finalGuards() {
  for (const [name, expected] of Object.entries(completionPlan.preservedV1Files)) assert.equal(await fileHash(resolve(v1, name)), expected, `Preserved v1 receipt changed: ${name}`);
  assert.equal(await fileHash(import.meta.filename), workerSha256);
  assert.equal(await fileHash(grantPath), grantSha256);
  assert.equal(await fileHash(resolve(import.meta.dirname, 'completion-plan.json')), approvedPlanSha256);
  assert.equal(await fileHash(originalHandoffPath), 'd990c3f9d0f7ed21c43a000af780222a9152ddfd4337a19726a1c89ab159b430');
  assert.equal(await fileHash(resolve(context, 'prepared.json')), originalJob.preparedReceiptSha256);
  assert.equal(await fileHash(resolve(context, 'primitive-plan.json')), originalJob.planSha256);
  assert.equal(await fileHash(resolve(context, 'after-generic-first-output-review.json')), completionPlan.firstImmutableInputs.rawTreeManifestReceiptSha256);
  assert.equal(await fileHash(resolve(context, 'outcome.json')), firstFailureSha256);
  const aliases = {
    'private-runner': resolve(root, '.work/full-parity-audit/primitive-next17-20261008/run-primitive-next17.mjs'),
    'private-plan': resolve(root, '.work/full-parity-audit/primitive-next17-20261008/primitive-next17.json'),
    'verification-browser': job.environment.HYFRME_BROWSER_EXECUTABLE,
    'sdk/package.json': resolve(sdk, 'package.json'),
    'sdk/bin/hyperframes.mjs': resolve(sdk, 'bin/hyperframes.mjs'),
  };
  for (const [path, expected] of Object.entries(prepared.state.filesSha256)) {
    const actualPath = aliases[path] ?? (path.startsWith('upstream/') ? resolve(root, job.environment.REMOCN_SOURCE, path.slice(9)) : resolve(root, path));
    const actual = path === 'sdk/dist-tree' ? digest(JSON.stringify(await treeHashes(resolve(sdk, 'dist')))) : await fileHash(actualPath);
    assert.equal(actual, expected, `Frozen input changed: ${path}`);
  }
  assert.deepEqual(await inputState(), capturedInputs, 'Current generic input state differs from the first capture');
  await assertArchives(prepared.archives, true);
  await assertArchives(firstOutput.canonical);
  assert.deepEqual(await treeHashes(raw), freshRecord.filesSha256, 'First preserved fresh tree changed');
  await assertActiveFirstTree();
  for (const [path, expected] of [
    [derived.installed, installedHashes],
    [derived.compiled, compiledHashes],
    [derived.nativeBundle, nativeBundleHashes],
    [resolve(root, '.work/verify-remocn-lossless/context-menu/installed'), installedHashes],
    [resolve(activeRaw, '.debug', debugNames[0], 'compiled'), compiledHashes],
    [resolve(root, '.work/remocn-lossless-reference/context-menu/bundle'), nativeBundleHashes],
  ]) assert.deepEqual(await treeHashes(path), expected, `Captured derived input changed: ${path}`);
  for (const path of [derived.nativeRoot, resolve(root, '.work/remocn-lossless-reference/context-menu/root.tsx')]) assert.equal(await fileHash(path), nativeRootSha256);
}

function owned(relative) {
  const path = resolve(output, relative);
  assert(path.startsWith(`${output}/`), 'Writes must stay within the new private completion directory');
  return path;
}
async function outputBytes() {
  let bytes = 0;
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const next = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(next);
      else if (entry.isFile()) bytes += (await stat(next)).size;
      else throw Error('Non-regular completion output');
    }
  }
  await visit(output);
  return bytes;
}
async function budget() {
  const fs = await statfs(root, { bigint: true });
  const availableBytes = Number(fs.bavail * fs.bsize);
  assert(availableBytes >= reserveBytes + maxOutputBytes, `Disk reserve failure: ${availableBytes} available`);
  const bytes = await outputBytes();
  assert(bytes <= maxOutputBytes, `Output budget exceeded: ${bytes}/${maxOutputBytes}`);
  return { availableBytes, outputBytes: bytes, reserveBytes, maxOutputBytes };
}
async function save(relative, value) {
  await budget();
  await writeFile(owned(relative), `${JSON.stringify(value, null, 2)}\n`);
  await budget();
}

const processes = [];
async function ffmpeg(args, name) {
  await budget();
  const record = { command: prepared.state.executables.ffmpeg, args, startedAt: new Date().toISOString(), pid: null, exitCode: null, signal: null, diskFailure: null, spawnFailure: null };
  const child = spawn(record.command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  record.pid = child.pid;
  let stdout = '', stderr = '', checking = false;
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  const timer = setInterval(async () => {
    if (checking || record.diskFailure || child.exitCode !== null) return;
    checking = true;
    try { await budget(); }
    catch (error) { record.diskFailure = error.message; child.kill('SIGTERM'); }
    finally { checking = false; }
  }, 1000);
  const [code, signal] = await new Promise(accept => {
    child.once('error', error => { record.spawnFailure = error.message; });
    child.once('close', (code, signal) => accept([code, signal]));
  });
  clearInterval(timer);
  while (checking) await new Promise(accept => setTimeout(accept, 10));
  Object.assign(record, { exitCode: code, signal, completedAt: new Date().toISOString() });
  processes.push(record);
  await writeFile(owned(`process-${name}.log`), stdout + stderr);
  assert.equal(record.spawnFailure, null, record.spawnFailure);
  assert.equal(record.diskFailure, null, record.diskFailure);
  assert.equal(code, 0, `CPU ${name} failed: ${signal ?? stderr}`);
  await budget();
}

async function decodedHashes(path, count) {
  const files = (await readdir(path)).filter(name => /^frame_\d{6}\.png$/.test(name)).sort();
  assert.equal(files.length, count);
  const hashes = [];
  for (const [index, file] of files.entries()) {
    assert.equal(Number(file.match(/\d+/)[0]), index + 1);
    const { data, info } = await sharp(resolve(path, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height, info.channels], [1280, 720, 4]);
    hashes.push({ sha256: digest(data), md5: digest(data, 'md5') });
  }
  return hashes;
}
async function hashRows(path) {
  const rows = (await readFile(path, 'utf8')).split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split(',').map(value => value.trim()));
  assert.equal(rows.length, 135);
  rows.forEach((row, frame) => { assert.equal(row.length, 6); assert.equal(Number(row[2]), frame); assert.equal(Number(row[4]), 1280 * 720 * 4); });
  return rows.map(row => row[5]);
}

// A pre-existing output directory makes this one-shot worker refuse any retry.
const fs = await statfs(root, { bigint: true });
assert(Number(fs.bavail * fs.bsize) >= reserveBytes + maxOutputBytes, 'Insufficient preflight disk reserve');
await finalGuards();
await mkdir(output);
const startedAt = new Date().toISOString();
let candidate = null, failure = null;
try {
  await save('attempt.json', { startedAt, workerPid: process.pid, workerSha256, grantSha256, firstFailureSha256, firstFailureAccepted: false, operation: 'CPU post-capture completion of the interrupted first run', newCaptureCheckRenderCount: 0, publicCanonicalWrites: false });
  const capture = await load(resolve(raw, 'fresh/capture.json'));
  assert.equal(capture.complete, true);
  assert.deepEqual(capture.frames, [...Array.from({ length: 135 }, (_, frame) => frame), ...job.repeatFrames]);
  assert.deepEqual(capture.profile, capturedInputs.captureProfile);
  assert.equal(capture.referenceCaptures.length, 140);
  assert.equal(capture.producerCaptures.length, 140);
  assert.equal(new Set(capture.referenceCaptures.map(record => record.browserPid)).size, 140);
  assert.equal(new Set(capture.producerCaptures.map(record => record.browserPid)).size, 140);
  assert.equal(capture.referenceErrors.length, 0);
  assert.equal(capture.producerErrors.length, 0);
  assert.equal(capture.externalRequests.length, 0);
  assert.equal(await fileHash(resolve(raw, 'fresh/served.html')), capture.servedHtmlSha256);
  assert.equal(await fileHash(resolve(derived.compiled, 'index.html')), capture.compiledSha256);
  const source = await decodedHashes(resolve(raw, 'fresh/reference'), 140);
  const producer = await decodedHashes(resolve(raw, 'fresh/hyperframes'), 140);
  const debug = await decodedHashes(resolve(raw, 'sequential-frames'), 135);
  assert.deepEqual(source.map(row => row.sha256), producer.map(row => row.sha256));
  assert.deepEqual(debug.map(row => row.md5), prepared.originalProducerHashes, 'Actual debug shifted from the saved ORIGINAL strict producer');
  const referenceHashes = resolve(raw, 'proof/reference-rgba.framemd5');
  assert.deepEqual(await hashRows(referenceHashes), source.slice(0, 135).map(row => row.sha256));
  assert.deepEqual(await hashRows(resolve(raw, 'proof/hyperframes-rgba.framemd5')), producer.slice(0, 135).map(row => row.sha256));
  assert.deepEqual(await hashRows(resolve(raw, 'proof/sequential/debug-render-rgba.framemd5')), debug.map(row => row.sha256));
  await assertExactFrameHashes(referenceHashes, resolve(raw, 'proof/hyperframes-rgba.framemd5'), shape);
  const repeats = await load(resolve(raw, 'proof/repeatability.json'));
  assert.deepEqual(repeats, job.repeatFrames.map((frame, index) => {
    assert.equal(source[frame].sha256, source[135 + index].sha256);
    assert.equal(producer[frame].sha256, producer[135 + index].sha256);
    assert.equal(source[frame].sha256, producer[frame].sha256);
    assert.equal(source[135 + index].sha256, producer[135 + index].sha256);
    return { frame, exact: true, rgbaSha256: source[frame].sha256 };
  }));
  const samples = [...(await readFile(resolve(raw, 'proof/ssim.log'), 'utf8')).matchAll(/All:([\d.]+)/g)].map(match => Number(match[1]));
  assert.equal(samples.length, 135); assert(samples.every(score => score === 1));
  const sequential = resolve(raw, 'proof/sequential');
  const checkText = await readFile(resolve(sequential, 'hyperframesCheck-hyperframes-check.log'), 'utf8');
  const check = JSON.parse(checkText.slice(checkText.indexOf('{')));
  for (const section of ['lint', 'runtime', 'layout', 'motion', 'contrast']) assert.equal(check[section].errorCount, 0);
  assert.equal(check.lint.ok, true); assert.equal(check.runtime.ok, true);
  assertHardwareGpuProbe(browserGpuProbeEvidence(checkText), 'Preserved actual full CLI check');
  const strictText = await readFile(resolve(sequential, 'hyperframesRender-hyperframes-render.log'), 'utf8');
  assertHardwareGpuProbe(browserGpuProbeEvidence(strictText), 'Preserved original mandatory strict CLI render');
  const debugText = await readFile(resolve(sequential, 'debug-render.log'), 'utf8');
  const debugProbe = browserGpuProbeEvidence(debugText);
  assert.deepEqual(debugProbe, await load(resolve(sequential, 'debug-gpu-probe.json')));
  assertHardwareGpuProbe(debugProbe, 'Preserved actual CLI debug render');
  const sequentialParity = await load(resolve(sequential, 'parity.json'));
  const comparison = await load(resolve(raw, 'proof/sequential-comparison.json'));
  const sequentialMismatches = source.slice(0, 135).flatMap((row, frame) => row.sha256 === debug[frame].sha256 ? [] : [frame]);
  assert.deepEqual(comparison.freshReferenceVsDebugProducerMismatchedFrames, sequentialMismatches);
  assert.equal(comparison.debugProducerMatchesOriginalSequentialProducer, true);
  const target = owned('artifacts/parity/context-menu-diff');
  await budget();
  await cp(resolve(context, 'after-generic/diff'), target, { recursive: true });
  await cp(sequential, resolve(target, 'sequential'), { recursive: true });
  await cp(resolve(raw, 'proof'), resolve(target, 'fresh'), { recursive: true });
  const previews = owned('artifacts/public/previews/context-menu');
  await mkdir(previews, { recursive: true });
  await cp(resolve(raw, 'reference.mp4'), resolve(previews, 'reference.mp4'));
  await budget();
  const stagedProof = resolve(target, 'fresh');
  // Validate the existing first reference archive; never re-encode it on failure.
  await ffmpeg(['-y', '-v', 'error', '-i', resolve(raw, 'proof/reference-lossless.mkv'), '-pix_fmt', 'rgba', '-f', 'framemd5', '-hash', 'sha256', resolve(stagedProof, 'reference-archive-rgba.framemd5')], 'reference-archive');
  await hashRows(resolve(stagedProof, 'reference-archive-rgba.framemd5'));
  await assertExactFrameHashes(referenceHashes, resolve(stagedProof, 'reference-archive-rgba.framemd5'), shape);
  const portPattern = resolve(raw, 'fresh/hyperframes/frame_%06d.png');
  await ffmpeg(['-y', '-v', 'error', '-framerate', '30', '-start_number', '1', '-i', portPattern, '-frames:v', '135', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(previews, 'hyperframes.mp4')], 'producer-mp4');
  await ffmpeg(['-y', '-v', 'error', '-framerate', '30', '-start_number', '1', '-i', portPattern, '-frames:v', '135', '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgra', resolve(stagedProof, 'hyperframes-lossless.mkv')], 'producer-lossless');
  await ffmpeg(['-y', '-v', 'error', '-i', resolve(stagedProof, 'hyperframes-lossless.mkv'), '-pix_fmt', 'rgba', '-f', 'framemd5', '-hash', 'sha256', resolve(stagedProof, 'hyperframes-archive-rgba.framemd5')], 'producer-archive');
  await hashRows(resolve(stagedProof, 'hyperframes-archive-rgba.framemd5'));
  await assertExactFrameHashes(referenceHashes, resolve(stagedProof, 'hyperframes-archive-rgba.framemd5'), shape);
  for (const file of ['summary.json', 'ssim.log', 'reference-rgba.framemd5', 'hyperframes-rgba.framemd5']) await cp(resolve(raw, 'proof', file), resolve(target, file));
  await cp(resolve(raw, 'fresh/reference/frame_000082.png'), resolve(previews, 'thumbnail.png'));
  await ffmpeg(['-y', '-v', 'error', '-i', resolve(previews, 'thumbnail.png'), '-i', resolve(raw, 'fresh/hyperframes/frame_000082.png'), '-filter_complex', 'hstack', '-frames:v', '1', resolve(target, 'worst-frame.png')], 'poster');
  await finalGuards();
  await cp(resolve(context, 'outcome.json'), resolve(stagedProof, 'first-environment-outcome.json'));
  await cp(import.meta.filename, resolve(stagedProof, 'cpu-post-capture-worker.mjs'));
  await cp(resolve(v1, 'execution-first-outcome.json'), resolve(stagedProof, 'v1-preflight-outcome.json'));
  await cp(resolve(v1, 'root-partial-output-review.json'), resolve(stagedProof, 'root-partial-output-review.json'));
  const lineage = { startedAt, completedAt: new Date().toISOString(), operation: 'CPU post-capture completion of the interrupted first run', workerPid: process.pid, workerSha256, grantSha256, approvedPlanSha256, capturedFingerprint: fingerprint, firstEnvironmentOutcomeSha256: firstFailureSha256, firstEnvironmentOutcomeAccepted: false, firstGenericExitCode: null, firstGenericProcessCompleted: false, originalAndFirstNewArchivedTreesImmutable: true, activeRemainingFirstTreeExact: true, activeOnlyDerivedShutdownChecksum: partial, preservedV1ReceiptHashes: completionPlan.preservedV1Files, v1PreflightRejected: true, rootIndependentArchiveReview: completionPlan.rootIndependentArchiveReview, all389FrozenGuardsPassed: true, actualDebugEqualsSavedOriginalMandatoryStrictProducer: true, newCaptureCheckRenderCount: 0, publicCanonicalWrites: false, actualFreshPerFrameBackend: 'unobserved', requestedFreshMode: capture.profile.rasterization, observedDebugGpuProbe: debugProbe, processes };
  await writeFile(resolve(stagedProof, 'cpu-post-capture-lineage.json'), `${JSON.stringify(lineage, null, 2)}\n`);
  const artifacts = {
    ...sequentialParity.artifacts,
    precedingParity: 'parity/context-menu-diff/fresh/preceding-parity.json',
    hyperframesDebugRender: 'parity/context-menu-diff/sequential/debug-render.log',
    freshCapture: 'parity/context-menu-diff/fresh/capture.json',
    freshInputs: 'parity/context-menu-diff/fresh/inputs.json',
    freshRepeatability: 'parity/context-menu-diff/fresh/repeatability.json',
    sequentialParity: 'parity/context-menu-diff/sequential/parity.json',
    sequentialComparison: 'parity/context-menu-diff/fresh/sequential-comparison.json',
    referenceLossless: 'parity/context-menu-diff/fresh/reference-lossless.mkv',
    hyperframesLossless: 'parity/context-menu-diff/fresh/hyperframes-lossless.mkv',
    referenceArchiveRgba: 'parity/context-menu-diff/fresh/reference-archive-rgba.framemd5',
    hyperframesArchiveRgba: 'parity/context-menu-diff/fresh/hyperframes-archive-rgba.framemd5',
    firstEnvironmentOutcome: 'parity/context-menu-diff/fresh/first-environment-outcome.json',
    postCaptureCompletion: 'parity/context-menu-diff/fresh/cpu-post-capture-lineage.json',
    postCaptureCompletionWorker: 'parity/context-menu-diff/fresh/cpu-post-capture-worker.mjs',
    precedingCpuPreflightOutcome: 'parity/context-menu-diff/fresh/v1-preflight-outcome.json',
    originalPartialArchiveReview: 'parity/context-menu-diff/fresh/root-partial-output-review.json',
  };
  const artifactHashes = {};
  for (const path of Object.values(artifacts)) {
    assert(path.startsWith('parity/context-menu-diff/') || path.startsWith('public/previews/context-menu/'));
    artifactHashes[path] = await fileHash(owned(`artifacts/${path}`));
  }
  for (const directory of ['sequential', 'fresh']) for (const [path, hash] of Object.entries(await treeHashes(resolve(target, directory)))) artifactHashes[`parity/context-menu-diff/${directory}/${path}`] = hash;
  const summary = await load(resolve(raw, 'proof/summary.json'));
  candidate = { ...sequentialParity, status: 'verified', fingerprint, result: { frameCount: 135, meanSsim: 1, minSsim: 1, p05Ssim: 1, p95Ssim: 1, alpha: summary.alpha, rgba: summary.rgba, pass: true }, checks: { ...sequentialParity.checks, browserGpuProbes: { ...sequentialParity.checks.browserGpuProbes, debugRender: debugProbe }, captureBackend: 'unobserved', frameCapture: 'fresh-browser native/production-producer; strict sequential CLI render retained separately', captureLifecycle: 'fresh-browser native/production-producer', captureProfile: capture.profile, repeatFrames: job.repeatFrames, strictSequentialCaptureComplete: true, sequentialRgbaExact: sequentialMismatches.length === 0, sequentialMismatchedFrames: sequentialMismatches, originalReferenceVsOriginalProducerMismatchedFrames: sequentialParity.result.rgba.mismatchedFrames, freshReferenceVsDebugProducerMismatchedFrames: sequentialMismatches, debugProducerMatchesOriginalSequentialProducer: true, freshRepeatFrames: repeats.map(repeat => repeat.frame), postCaptureCompletion: 'Corrected v2 CPU completion from immutable first captures; original interruption, derived partial shutdown checksum and v1 preflight rejection retained separately' }, artifacts, artifactHashes };
  assertExactCompiledParity(candidate, fixture);
  await save('candidate-parity.json', candidate);
  await finalGuards();
  await budget();
} catch (error) {
  failure = error.message;
  candidate = null;
}
let finalGuardFailure = null;
try { await finalGuards(); }
catch (error) { finalGuardFailure = error.message; candidate = null; }
const result = { startedAt, completedAt: new Date().toISOString(), workerPid: process.pid, workerSha256, grantSha256, capturedFingerprint: fingerprint, acceptedPrivateCompletion: candidate !== null && !failure && !finalGuardFailure, failure, finalGuardFailure, originalFirstEnvironmentOutcomeSha256: firstFailureSha256, originalFirstEnvironmentFailureUnchanged: finalGuardFailure === null, publicCanonicalWrites: false, newCaptureCheckRenderCount: 0, noRetry: true, version: 2, preservedV1PreflightRejection: true, activeOnlyDerivedShutdownChecksum: partial, processes };
await writeFile(owned('outcome.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
if (!result.acceptedPrivateCompletion) process.exitCode = 1;
