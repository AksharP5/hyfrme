# Editable DOM baseline

This frozen source uses the official T3 Code v0.0.42 DOM and CSS for the Fast Service Tier popup without native screenshot crops. Its SHA-256 matches both original 120-frame verification results. The native and port Fast row, title, and description had identical computed styles and bounding boxes in a live-app probe, but their small glyph edges rasterized differently in HyperFrames.

The full 120-frame composition passed the whole-frame gate in both themes. The focused Fast hover row scored 0.951806 dark and 0.948167 light, below the 0.970 row gate. The final block retains this editable DOM path for changed visible content and uses cropped pixels from the pinned native reference for the unchanged default popup. These measured DOM scores remain a limitation of edited states, rather than evidence of pixel-identical custom output.
