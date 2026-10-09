# Hyfrme

Copy-paste motion components for [HyperFrames](https://hyperframes.heygen.com/).
Preview a component, customize it in your browser, and add it to your video with
one command. The source is yours to edit.

https://github.com/user-attachments/assets/74855edd-7a1a-4291-8d90-ecf137d8511d

[Browse components](https://hyfrme.vercel.app/components) ·
[See examples](https://hyfrme.vercel.app/showcases)

## Get started

Run this inside a HyperFrames project containing `hyperframes.json`:

```bash
npx hyfrme@latest add screen-lift
```

The installer copies the component and its required assets into your project,
then prints the markup to add to your composition. It uses the paths configured
in your project.

Screen Lift animates a phone close-up with two raised chat rows. Change the
messages, names, profile photos, colors, and camera angle on its
[component page](https://hyfrme.vercel.app/components/screen-lift), then copy the
install command for your version.

## Customize your components

Component pages provide source, previews, and controls for supported
composition variables. Official CSS parameters without a declared variable are
edited directly in the installed source. Shared links keep numbers within the component's declared limits and
restore defaults for malformed values or unsupported choices. You can also set
values when installing:

```bash
npx hyfrme@latest add screen-lift \
  --set 'chat2Name=Taylor Park' \
  --set 'chat2Message=Made this with Hyfrme.' \
  --set 'lift=120'
```

Your choices become the installed component's defaults. Keep adjusting them in
HyperFrames, or edit the copied HTML, CSS, and JavaScript directly. Hyfrme is
not a runtime dependency.

The catalog includes Hyfrme originals and components adapted from Remocn,
Snapcn, and T3 Code, plus the complete pinned official HyperFrames catalog. Use the source filters to browse each collection. Snapcn
component names start with `snapcn-`, such as `snapcn-phone-frame`. T3 Code
blocks reproduce the desktop app at the pinned v0.0.42 release. Native dark
and light captures and parity results are listed in the
[T3 Code coverage record](docs/T3_CODE_COVERAGE.md).

## Install more

Add several components at once:

```bash
npx hyfrme@latest add soft-blur-in matrix-decode snapcn-phone-frame
```

Choose a different project:

```bash
npx hyfrme@latest add screen-lift --dir ./my-video
```

Install all blocks and reusable components (templates are initialized separately):

```bash
npx hyfrme@latest add --all
```

## Official HyperFrames catalog and templates

The HyperFrames source filter includes 165 blocks, 223 reusable HTML components,
and all 8 official templates, grouped as they are upstream. This covers all 394
published registry entries plus Week in Merges and Simulated Cursor from the official
website. Names start with `hyperframes-`:

```bash
npx hyfrme@latest add hyperframes-data-chart hyperframes-spring-pop
npx hyfrme@latest init hyperframes-product-promo --dir ./product-promo
```

Block installs print composition markup. Component installs print guidance for
pasting the snippet's markup, styles, and script into a scene. Template initialization
copies a complete project and creates `hyperframes.json` when absent. Four templates
use the official no-video defaults: a 10-second project with placeholder media removed.
Decision Tree includes a small renderer compatibility fix in the initialized copy.
Existing conflicting files require `--force`; unrelated files stay intact.

The import preserves the original HTML, scripts, assets, attribution, and Apache 2.0
license. Its source hashes are checked against the pinned official catalog. Native
source copies do not claim a Remocn/Snapcn SSIM comparison. See the
[official catalog record](docs/HYPERFRAMES_CATALOG.md).

## Use with your coding agent

Install the Hyfrme skill so your agent can find, customize, and add components:

```bash
npx skills@latest add AksharP5/hyfrme --yes
```

Then ask:

```text
Use Hyfrme to add a motion component that fits this scene. Customize it to my
project's style and wire it into my HyperFrames composition.
```

## License and credits

Hyfrme's own code is MIT licensed. Adapted components retain their original
attribution, and required third-party licenses are included with installed
components. See [third-party notices](THIRD_PARTY_NOTICES.md).

Hyfrme is an independent project and is not affiliated with HyperFrames,
Remocn, or Snapcn.

For local development and contributions, see the [development guide](docs/DEVELOPMENT.md).
