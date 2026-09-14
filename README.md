# Hyfrme

Copy-paste motion components for [HyperFrames](https://hyperframes.heygen.com/).
Preview a component, customize it in your browser, and add it to your video with
one command. The source is yours to edit.

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

Every component page provides a live preview and controls for its supported
variables. You can also set values when installing:

```bash
npx hyfrme@latest add screen-lift \
  --set 'chat2Name=Taylor Park' \
  --set 'chat2Message=Made this with Hyfrme.' \
  --set 'lift=120'
```

Your choices become the installed component's defaults. Keep adjusting them in
HyperFrames, or edit the copied HTML, CSS, and JavaScript directly. Hyfrme is
not a runtime dependency.

The catalog includes Hyfrme originals and components adapted from Remocn and
Snapcn. Use the source filters to browse each collection. Snapcn component names
start with `snapcn-`, such as `snapcn-phone-frame`.

## Install more

Add several components at once:

```bash
npx hyfrme@latest add soft-blur-in matrix-decode snapcn-phone-frame
```

Choose a different project:

```bash
npx hyfrme@latest add screen-lift --dir ./my-video
```

Install the full catalog:

```bash
npx hyfrme@latest add --all
```

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
