import { useState } from "react";
import type { InstallCommands, InstallMode } from "../lib/customization";
import { CopyButton } from "./CopyButton";

type InstallPanelProps = {
  commands: InstallCommands;
  customized: boolean;
};

const modes: InstallMode[] = ["prompt", "pnpm", "yarn", "npm", "bun"];

function initialMode(): InstallMode {
  const stored = window.localStorage.getItem("hyfrme/install-mode");
  return modes.includes(stored as InstallMode)
    ? (stored as InstallMode)
    : "npm";
}

export function InstallPanel({ commands, customized }: InstallPanelProps) {
  const [mode, setMode] = useState<InstallMode>(initialMode);
  const command = commands[mode];

  const selectMode = (next: InstallMode) => {
    setMode(next);
    window.localStorage.setItem("hyfrme/install-mode", next);
  };

  return (
    <section
      className="install-panel detail-section"
      aria-labelledby="install-title"
    >
      <div className="install-panel-copy">
        <h2 id="install-title">Installation</h2>
        <p>
          {customized
            ? "This command installs the version you customized above."
            : "Copy the block and its required assets into your project."}
        </p>
      </div>
      <div className="command-shell">
        <div className="command-shell-bar">
          <div role="tablist" aria-label="Install method">
            {modes.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={mode === candidate}
                onClick={() => selectMode(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
          <CopyButton
            value={command}
            label={mode === "prompt" ? "Copy prompt" : "Copy command"}
            className="copy-button"
          />
        </div>
        <code>
          {mode === "prompt" ? null : <span aria-hidden="true">$</span>}{" "}
          {command}
        </code>
      </div>
    </section>
  );
}
