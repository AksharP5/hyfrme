const htmlEntities = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function parseHyperframesVariables(source) {
  const declaration = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .match(/data-composition-variables='([^']*)'/)?.[1];
  if (declaration === undefined) return undefined;
  const variables = JSON.parse(
    declaration.replace(
      /&(amp|quot|#39|lt|gt);/g,
      (entity) => htmlEntities[entity],
    ),
  );
  if (
    !Array.isArray(variables) ||
    variables.some(
      (variable) =>
        !variable || typeof variable.id !== "string" || !variable.id,
    ) ||
    new Set(variables.map((variable) => variable.id)).size !== variables.length
  )
    throw new Error("Invalid HyperFrames variable declaration.");
  return variables;
}
