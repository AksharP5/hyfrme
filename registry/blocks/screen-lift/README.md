# Screen Lift

A Hyfrme original. A 4-second, 1280×960 phone close-up at 30 fps. Two HTML chat
rows rise into a shallow overlapping stack while light catches the phone's
glass and rim. The screen and phone are HTML/CSS, with individual photo avatars.

```bash
npx hyfrme@latest add screen-lift
```

The host composition must load GSAP, as with other HyperFrames blocks. A local
copy is included at `assets/screen-lift/gsap.min.js`.

## Customize

All controls work in the catalog, through CLI `--set`, and through HyperFrames
composition variables. Each chat's name, message, time, photo, and avatar color is
editable. Clear a photo URL to show initials from the contact's name. Text is inserted literally, so
punctuation and HTML-like text remain text.

| Variables                                                | Purpose                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `title`, `profileText`, `clock`, `filter`, `search`      | App header, profile initials, status time, and labels            |
| `chat1Name` … `chat6Name`                                | Contact names                                                    |
| `chat1Message` … `chat6Message`                          | Message previews                                                 |
| `chat1Time` … `chat6Time`                                | Relative timestamps                                              |
| `chat1Avatar` … `chat6Avatar`                            | Photo URLs or project-relative paths; empty for initials         |
| `chat1Color` … `chat6Color`                              | Initials avatar colors                                           |
| `screenColor`, `surfaceColor`, `textColor`, `mutedColor` | Screen, search field, and text colors                            |
| `accentColor`, `profileColor`                            | Unread indicator and profile gradient                            |
| `lift`                                                   | Front row depth, 30–160. Default 100                             |
| `angle`                                                  | Camera roll, 4–20 degrees. Default 12                            |
| `focusRow`                                               | First lifted chat, 1–5. Default 2. The next chat lifts behind it |
| `rowHeight`                                              | Chat height, 96–150 screen pixels. Default 112                   |

```bash
npx hyfrme@latest add screen-lift \
  --set 'title=Inbox' \
  --set 'chat2Name=Taylor Park' \
  --set 'chat2Message=Every word is editable.' \
  --set 'chat2Color=#654080' \
  --set 'focusRow=2' --set 'lift=100'
```

Both lifted rows use the same HTML and values as their rows on the screen.
They share the glass lighting until their lift begins. Long names and messages
truncate within the row. Edit the installed HTML/CSS for further layout changes.

This version replaces the former screenshot controls `image`, `focusY`, and
`focusHeight` with chat variables, `focusRow`, and `rowHeight`.

## Attribution

- Original composition and chat layout: Hyfrme, MIT. Names and messages are fictional.
- Demo photos: Snapcn's MIT-licensed `public/avatars/01.jpg` through `06.jpg`,
  pinned at `353803b506dba0cb7ca13bb45b0d099690400815` in
  https://github.com/snapcndev/snapcn.
- Geist: SIL Open Font License 1.1.
- GSAP 3.14.2: GreenSock's standard license, retained in the distributed
  script header: https://gsap.com/standard-license.

License files are installed under `THIRD_PARTY_LICENSES/screen-lift/`.
This is original motion, so there is no upstream visual parity claim.
