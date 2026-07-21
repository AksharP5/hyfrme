# Hyfrme contributor guidance

Start with the `hyperframes` skill before changing a composition. Use the
`remotion-to-hyperframes` workflow for ports and `hyperframes-registry` for
package metadata.

After editing a composition:

1. Render the pinned Remocn fixture.
2. Run the full HyperFrames check on the installed block fixture.
3. Render the HyperFrames version with identical dimensions, fps, and duration.
4. Recompute SSIM and update the parity manifest and artifacts.
5. Run `npm run check` and `npm run build` for the catalog.

Do not mark a port verified based on visual inspection alone. Keep third-party
attribution and the pinned upstream commit with every derived port.
