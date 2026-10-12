# Before / After

A Hyfrme original. A 4-second, 1280×960 comparison at 30 fps. A lit divider
reveals a dark Hyfrme interface over its light version inside a glass browser
frame. The interface is editable HTML/CSS.

```bash
npx hyfrme@latest add before-after
```

The host composition must load GSAP, as with other HyperFrames blocks. A local
copy is included at `assets/before-after/gsap.min.js`.

## Customize

| Variable | Purpose |
| --- | --- |
| `title` | Page heading in both designs |
| `subtitle` | Supporting copy in both designs |
| `value` | Displayed duration text |
| `delta` | Format label beside the duration |
| `beforeLabel`, `afterLabel` | Labels identifying the two states |
| `accent` | Accent color for the revealed design and divider |

```bash
npx hyfrme@latest add before-after \
  --set 'title=Made with Hyfrme' \
  --set 'subtitle=Your next video starts here.' \
  --set 'accent=#b8e2ff'
```

These variables work in the catalog editor, CLI `--set`, and HyperFrames.
Copy is inserted as literal text. `value` is a label; changing it does not
retime the animation. Edit the installed HTML/CSS to change either interface,
the chart, or the other demo labels. Both designs share the same markup.

## Attribution

- Original composition and Hyfrme demo interface: Hyfrme, MIT.
- Geist: SIL Open Font License 1.1.
- GSAP 3.14.2: GreenSock's standard license, retained in the script header:
  https://gsap.com/standard-license.

License files install under `THIRD_PARTY_LICENSES/before-after/`.
Verification compares the canonical Hyfrme source with a CLI installation.
There is no upstream visual parity claim.
