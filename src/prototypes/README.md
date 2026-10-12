# Homepage exploration

Open `/prototypes.html` on the Vite development server for the current homepage.
It is isolated from the production entry point. `Refined.tsx` and `refined.css`
contain the current design.

The current pass follows the user's references: [Remocn](https://remocn.dev),
[Snapcn](https://snapcn.dev), and [Raylight](https://www.raylight.app). Their live
pages were inspected at 1440px. The direction uses restrained Manrope typography,
a centered product message, compact controls, a mixed-width preview gallery,
and a searchable component grid. It starts light and supports a dark theme.
The Manrope font and its license already ship with the GitHub Stars block.

Gallery navigation, category filters, search, package-manager selection, and
clipboard actions work. Ctrl/Cmd+K focuses search. Preview playback stops when
offscreen, when the tab is hidden, or when the user pauses. Reduced motion is
respected, with an explicit play control for opting in.

The rejected round remains at `/prototypes.html?round=2`. On that page, choose
with the floating picker, keys 1-5, or arrow keys. R resets the current design.
`?round=2&v=2` opens Reel directly.

Round two responds to the preference for Cinema with five different layouts:

| Design | Direction                                       | Tradeoff                                  |
| ------ | ----------------------------------------------- | ----------------------------------------- |
| Cut    | Large type and staggered motion studies         | Fewer components above the fold           |
| Reel   | Screening room with a selectable filmstrip      | One scene gets most of the attention      |
| Index  | Pale, compact visual archive with search        | Less theatrical, more useful for browsing |
| Type   | Orange typographic poster with shader previews  | The strongest visual departure            |
| Lens   | Gallery panels expand around the selected scene | Inactive previews are cropped             |

Design read: a motion catalog for designers and developers, built around actual
rendered work. Native CSS and existing local fonts. Layout variance 8, interface
motion 3, density 4. Video motion demonstrates the product; controls stay quiet.

Every variant uses real registry names, local preview assets, source attribution,
and existing component routes. Playback pauses offscreen and with a hidden tab.
Reduced-motion preferences disable autoplay. Index starts pale for comparison
and has a theme toggle; other variants support the system color scheme.

The original Edition, Cinema, and Workbench source files remain for reference.
The five round-two designs appear in the archived picker. Promote a design only
after the user chooses it.
