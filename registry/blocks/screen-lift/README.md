# Screen Lift

A Hyfrme original. A 4-second, 1280×960 phone close-up at 30 fps. Two adjacent
regions of a screenshot rise into a shallow overlapping stack while light
catches the phone's glass and rim.

```bash
npx hyfrme@latest add screen-lift
```

The host composition must load GSAP, as with other HyperFrames blocks. A local
copy is included at `assets/screen-lift/gsap.min.js`.

## Customize

| Variable      | Default                  | Purpose                                                     |
| ------------- | ------------------------ | ----------------------------------------------------------- |
| `image`       | Included demo screenshot | Screenshot URL or project-relative image path               |
| `lift`        | `100`                    | Front row depth, from 30 to 160                             |
| `angle`       | `12`                     | Camera roll in degrees, from 4 to 20                        |
| `focusY`      | `379`                    | Top of the front row in screen coordinates, from 270 to 850 |
| `focusHeight` | `112`                    | Height of each selected row, from 80 to 200                 |

```bash
npx hyfrme@latest add screen-lift \
  --set 'image=assets/my-screen.png' \
  --set 'focusY=379' --set 'focusHeight=112' --set 'lift=100'
```

Images fill a 600×1260 screen. Use a screenshot with that aspect ratio; the demo
is rendered at 1200×2520 for sharper close-ups. Both lifted regions span the full
screen width. `focusY` selects the first region and the second starts immediately
below it. The crop stays part of the shared glass lighting until the lift begins.

The included `assets/screen-lift/demo-screen.html` is the editable chat layout.
Its names and messages are fictional. To change that demo, edit the HTML and
capture its full 600×1260 page at 2× resolution, replacing `screen.png`.
Setting `image` to your own screenshot needs no HTML edits.

## Attribution

- Original composition and chat layout: Hyfrme, MIT.
- Demo avatars: Snapcn's MIT-licensed assets, pinned at
  `353803b506dba0cb7ca13bb45b0d099690400815`, files `public/avatars/01.jpg`
  through `06.jpg` in https://github.com/snapcndev/snapcn. These assets do not
  make this composition a Snapcn port.
- Geist: SIL Open Font License 1.1.
- GSAP 3.14.2: GreenSock's standard license, retained in the distributed
  script header: https://gsap.com/standard-license.

License files are installed under `THIRD_PARTY_LICENSES/screen-lift/`.
This is original motion, so there is no upstream visual parity claim.
