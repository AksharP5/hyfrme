# hyfrme

Copy customizable motion components from
[Hyfrme](https://hyfrme.vercel.app) into a HyperFrames project.

```bash
npx hyfrme@latest add soft-blur-in
```

The catalog includes Remocn and Snapcn ports, Hyfrme originals, and the official
HyperFrames blocks, reusable components, and templates. Snapcn block
names use a prefix:

```bash
npx hyfrme@latest add snapcn-phone-frame
```

Install all blocks and reusable components (templates use `init`):

```bash
npx hyfrme@latest add --all
```

Customize supported defaults while installing:

```bash
npx hyfrme@latest add matrix-decode \
  --set 'text=HELLO WORLD' \
  --set 'fontSize=31'
```

Run the command inside a project with `hyperframes.json`, or pass
`--dir <project>`. Hyfrme respects the project's configured block, component,
and asset paths.
An empty or missing `--dir` path is rejected before files are written.
References in installed markup, scripts, and default media values follow those
paths, including dynamically assembled asset URLs and query strings. Reserved
characters in configured paths are URL-encoded; filesystem names stay unchanged.

```text
hyfrme add <name>... [--dir <project>] [--force]
hyfrme add <name> [--set <key=value>]... [--dir <project>] [--force]
hyfrme add --all [--dir <project>] [--force]
hyfrme init <template> [--dir <project>] [--force]
```

Browse components and build customized commands at
[hyfrme.vercel.app](https://hyfrme.vercel.app).

Official names start with `hyperframes-`:

```bash
npx hyfrme@latest add hyperframes-data-chart hyperframes-spring-pop
npx hyfrme@latest init hyperframes-product-promo --dir ./product-promo
```

Native blocks retain their composition IDs. Reusable components are HTML snippets;
paste their markup, styles, and script into your scene. Templates copy a full project
and create missing configuration. Video scaffold templates use the official no-video
default: 10 seconds, with placeholder media removed. Existing conflicting files require
`--force`; unrelated files remain intact. A directory at a target file path is
rejected before any files are changed, including with `--force`. Decision Tree
initialization includes a
renderer compatibility fallback for its measured label timing.

`--set` accepts declared composition variables, including enum options and string
length limits. Edit CSS parameters without declared variables directly in the source.
