import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function readNativeSourceCode(root) {
  const source = resolve(root, 'assets/t3-code/v0.0.42');
  const proof = JSON.parse(await readFile(resolve(source, 'native-source-code-v0042-provenance.json'), 'utf8'));
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const commit = '719a76ca1dbf5490f1aa33ffb9966301e02be9a9';
  if (proof.sourceCommit !== commit || JSON.stringify(proof.crop) !== JSON.stringify({x:661,y:92,width:283,height:256}) ||
      Object.keys(proof.themes).sort().join(',') !== 'dark,light') throw new Error('Native code crop contract differs');
  for (const theme of ['dark', 'light']) {
    const entry = proof.themes[theme];
    const suffix = theme === 'light' ? '-light' : '';
    if (entry.asset !== `native-source-code-v0042-${theme}.png` || entry.source.frame !== 80) throw new Error('Native code asset origin differs');
    for (const [kind, basename] of [['source', 'source-file-open'], ['terminal', 'terminal-check']]) {
      const origin = entry[kind];
      if (origin.fixture !== `assets/t3-code/v0.0.42/${basename}${suffix}-fixture.json` ||
          origin.video !== `parity/t3-${basename}-v0042${suffix}-reference.mkv`) throw new Error('Native code authority path differs');
      const bytes = await readFile(resolve(root, origin.fixture));
      const fixture = JSON.parse(bytes);
      if (hash(bytes) !== origin.fixtureSha256 || fixture.sourceCommit !== commit || fixture.theme !== theme ||
          fixture.fps !== 30 || fixture.frames !== 120 || fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 ||
          fixture.referenceSha256 !== origin.videoSha256 || hash(await readFile(resolve(root, origin.video))) !== origin.videoSha256) {
        throw new Error('Native code authority bytes differ');
      }
    }
    const png = await readFile(resolve(source, entry.asset));
    if (hash(png) !== entry.pngSha256 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
        png.readUInt32BE(16) !== 283 || png.readUInt32BE(20) !== 256) throw new Error('Native code PNG bytes/dimensions differ');
    const decoded = spawnSync('ffmpeg', ['-hide_banner','-loglevel','error','-i',resolve(source,entry.asset),'-frames:v','1','-pix_fmt','rgba','-f','rawvideo','pipe:1'], {maxBuffer:1024*1024});
    if (decoded.status !== 0 || decoded.stdout.length !== 283*256*4 || hash(decoded.stdout) !== entry.rgbaSha256) throw new Error('Native code PNG RGBA differs');
    for (const [rows, start, count, pristine] of [[entry.source.frames,80,40,true], [entry.terminal.unoccludedFrames,0,20,true], [entry.terminal.occludedFrameHashes,20,20,false]]) {
      if (rows.length !== count || rows.some((row,index) => row.frame !== start+index || !/^[a-f0-9]{64}$/.test(row.rgbaSha256) || pristine && row.rgbaSha256 !== entry.rgbaSha256)) {
        throw new Error('Native code ordered frame evidence differs');
      }
    }
  }
  return proof;
}

export const nativeSourceCodeRuntime = `
const nativeCodeAllowed = ['dark', 'light'].includes(options.theme) &&
  Object.keys(defaults).every(key => key === 'theme' || options[key] === defaults[key]);
const nativeCodeImages = [];
if (nativeCodeAllowed) {
  for (const state of states.filter(state => state.dataset.t3Theme === options.theme && ['opened', 'source', 'add-menu'].includes(state.dataset.t3Phase))) {
    const host = state.querySelector('diffs-container');
    if (!host) continue;
    const image = document.createElement('img');
    image.dataset.nativeSourceCode = '';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.setAttribute('data-layout-ignore', '');
    image.style.cssText = 'position:absolute;left:0;top:0;width:283px;height:256px;z-index:1;pointer-events:none';
    image.src = options.theme === 'light'
      ? 'compositions/native-source-code-v0042-light.png'
      : 'compositions/native-source-code-v0042-dark.png';
    host.shadowRoot.append(image);
    nativeCodeImages.push(image);
  }
}
const nativeCodeReady = Promise.all(nativeCodeImages.map(image => image.decode()));
window.addEventListener('hf-seek', event => event.detail.waitUntil(nativeCodeReady));
`;
