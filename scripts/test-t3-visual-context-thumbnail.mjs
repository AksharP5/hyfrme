import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'assets/t3-code/v0.0.42');
const generator = await readFile(resolve(root, 'scripts/generate-t3-visual-context-v0042-port.mjs'), 'utf8');
const boundary = generator.slice(generator.indexOf('function assertNativePreview('), generator.indexOf('const previewProvenance ='));
const validate = new Function('createHash', boundary + '\nreturn assertNativePreview;')(createHash);
const provenance = JSON.parse(await readFile(resolve(source, 'visual-context-shelf-native-preview.json'), 'utf8'));
const preview = await readFile(resolve(source, 'visual-context-shelf-logo-enter-preview.png'));
const input = await readFile(resolve(source, 'visual-context-shelf-logo-enter.png'));
const fixtures = Object.fromEntries(await Promise.all(['dark', 'light'].map(async theme => [theme,
  await readFile(resolve(source, `visual-context-v0042-${theme}-fixture.json`))])));
// The generator checks the real official module. This boundary test needs no reference binary installation.
const module = Buffer.from('function YF(){} async function XF(){} function ZF(){} function eI(){} function tI(){} async function nI(){} var rI=new WeakMap; function iI(){} async function aI(){}');
const fixture = structuredClone(provenance);
fixture.sourcePipeline.moduleSha256 = createHash('sha256').update(module).digest('hex');
const moduleText = module.toString();
const functions = 'var JF=32768;' + moduleText.slice(moduleText.indexOf('function YF('), moduleText.indexOf('function ZF(')) + moduleText.slice(moduleText.indexOf('function eI('), moduleText.indexOf('async function aI('));
fixture.sourcePipeline.extractedFunctionsSha256 = createHash('sha256').update(functions).digest('hex');

test('native preview provenance is portable and matches actual immutable assets and fixtures', () => {
  assert.doesNotThrow(() => validate(fixture, preview, input, module, fixtures));
  assert.doesNotMatch(JSON.stringify(provenance), /\/home\/|\.work\/|blob:|data:image|127\.0\.0\.1/);
});

test('changed native preview bytes or claimed identity fail closed', () => {
  const altered = Buffer.from(preview);
  altered[altered.length - 1] ^= 1;
  assert.throws(() => validate(fixture, altered, input, module, fixtures), /PNG changed/);
  const changed = structuredClone(fixture);
  changed.preview.sha256 = '0'.repeat(64);
  assert.throws(() => validate(changed, preview, input, module, fixtures), /PNG changed/);
});

test('changed source image, pipeline, or official module fail closed', () => {
  assert.throws(() => validate(fixture, preview, Buffer.from('other image'), module, fixtures), /source or pipeline changed/);
  assert.throws(() => validate(fixture, preview, input, Buffer.from('other module'), fixtures), /source or pipeline changed/);
  const changed = structuredClone(fixture);
  changed.sourcePipeline.crop = 'stretch';
  assert.throws(() => validate(changed, preview, input, module, fixtures), /source or pipeline changed/);
});

test('stale source fixture or a mismatched native reference comparison fail closed', () => {
  assert.throws(() => validate(fixture, preview, input, module, { ...fixtures, light: Buffer.from('{}') }), /fixture changed/);
  const changed = structuredClone(fixture);
  changed.nativeComparison.originalReferenceSha256 = '0'.repeat(64);
  assert.throws(() => validate(changed, preview, input, module, fixtures), /origin comparison changed/);
});
