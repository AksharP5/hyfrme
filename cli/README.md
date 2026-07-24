# hyfrme

Copy customizable motion components from
[Hyfrme](https://hyfrme.vercel.app) into a HyperFrames project.

```bash
npx hyfrme@latest add soft-blur-in
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

```text
hyfrme add <name> [--set <key=value>]... [--dir <project>] [--force]
```

Browse components and build customized commands at
[hyfrme.vercel.app](https://hyfrme.vercel.app).
