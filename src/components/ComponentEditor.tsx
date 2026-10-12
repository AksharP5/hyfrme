import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  type CatalogEntry,
  cardDescription,
  catalogDescriptor,
} from "../catalog";
import { CodePanel } from "./CodePanel";
import { Customizer } from "./Customizer";
import { InstallPanel } from "./InstallPanel";
import { LivePreview } from "./LivePreview";
import { VariableTable } from "./VariableTable";
import {
  buildInstallCommands,
  buildUsageSnippet,
  defaultValues,
  customizedSource,
  parseCompositionVariables,
  type CustomValues,
  valuesFromUrl,
  writeValuesToUrl,
} from "../lib/customization";

const ComparisonPlayer = lazy(() =>
  import("./ComparisonPlayer").then((module) => ({
    default: module.ComparisonPlayer,
  })),
);

export function ComponentEditor({
  entry,
  cliPackage,
}: {
  entry: CatalogEntry;
  cliPackage: string;
}) {
  const [source, setSource] = useState("");
  const [details, setDetails] = useState<Awaited<
    ReturnType<CatalogEntry["loadDetails"]>
  > | null>(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState<CustomValues>({});
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const variables = useMemo(() => parseCompositionVariables(source), [source]);
  const defaults = useMemo(() => defaultValues(variables), [variables]);
  const effectiveValues = useMemo(
    () => ({ ...defaults, ...values }),
    [defaults, values],
  );
  const parity = details?.parity;
  const native = entry.source.id === "hyperframes";
  const template = entry.item.type === "hyperframes:example";
  const snippet = entry.item.type === "hyperframes:component";
  const sourceUrl = entry.item.origin
    ? `${entry.item.origin.repository}/blob/${entry.item.origin.commit}/${entry.item.origin.source.replace(/registry-item\.json$/, entry.item.sourcePath)}`
    : `https://github.com/AksharP5/hyfrme/blob/main/registry/blocks/${entry.item.name}/${entry.item.sourcePath}`;
  const customized = variables.some(
    (variable) => effectiveValues[variable.id] !== variable.default,
  );
  const installCommands = buildInstallCommands(
    cliPackage,
    entry.item.name,
    variables,
    effectiveValues,
    template ? "init" : "add",
  );
  const usageSnippet =
    native && (snippet || template)
      ? customizedSource(source, effectiveValues)
      : buildUsageSnippet(entry.item, variables, effectiveValues);
  useEffect(() => {
    let active = true;
    document.title = `${entry.item.title} — Hyfrme`;
    setSource("");
    setDetails(null);
    setLoadError("");
    Promise.all([entry.loadSource(), entry.loadDetails()])
      .then(([nextSource, nextDetails]) => {
        if (!active) return;
        const nextVariables = parseCompositionVariables(nextSource);
        const nextValues = valuesFromUrl(nextVariables);
        writeValuesToUrl(nextVariables, nextValues);
        setValues(nextValues);
        setSource(nextSource);
        setDetails(nextDetails);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, [entry]);

  const changeValue = (id: string, value: string | number | boolean) => {
    setValues((current) => {
      const next = { ...current, [id]: value };
      writeValuesToUrl(variables, next);
      return next;
    });
  };

  const resetValues = () => {
    setValues(defaults);
    writeValuesToUrl(variables, defaults);
  };

  return (
    <>
      <header className="detail-header">
        <span className="section-kicker">
          {catalogDescriptor(entry)} · {entry.item.name}
        </span>
        <h1>{entry.item.title}</h1>
        <p>{cardDescription(entry)}</p>
        <a
          className="detail-source"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${entry.item.title} source on GitHub`}
          title="View source on GitHub"
        >
          <span className="source-badge">{entry.source.label}</span>
        </a>
      </header>

      <section className="component-workbench" aria-label="Component editor">
        <div className="workbench-tabs" role="tablist" aria-label="View">
          <div>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "preview"}
              onClick={() => setTab("preview")}
            >
              Preview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "code"}
              onClick={() => setTab("code")}
            >
              Code
            </button>
          </div>
          <span>
            {entry.item.dimensions && entry.item.duration !== null
              ? `${entry.item.dimensions.width} × ${entry.item.dimensions.height} · ${entry.item.duration.toFixed(1)}s`
              : "HTML snippet"}
          </span>
        </div>

        {tab === "preview" ? (
          loadError ? (
            <div className="preview-loading" role="alert">
              {loadError}
            </div>
          ) : template && entry.item.preview.video ? (
            <video
              className="template-preview"
              src={entry.item.preview.video}
              poster={entry.item.preview.poster ?? undefined}
              controls
              autoPlay
              loop
              muted
              playsInline
              aria-label={`${entry.item.title} template preview`}
            />
          ) : source && details ? (
            <LivePreview
              item={details.item}
              source={source}
              values={effectiveValues}
            />
          ) : (
            <div className="preview-loading">Loading live preview…</div>
          )
        ) : (
          <CodePanel.Source
            source={usageSnippet}
            filename={
              native && (snippet || template)
                ? entry.item.sourcePath
                : "index.html"
            }
            copyLabel="Copy code"
          />
        )}

        {variables.length > 0 ? (
          <Customizer
            item={entry.item}
            variables={variables}
            values={effectiveValues}
            onChange={changeValue}
            onReset={resetValues}
            shareUrl={window.location.href}
          />
        ) : null}
      </section>

      <InstallPanel
        commands={installCommands}
        customized={customized}
        template={template}
        snippet={snippet}
      />

      {native && details ? (
        <section className="detail-section">
          <h2>Official HyperFrames source</h2>
          <p>
            Original source and required assets, copied from the pinned official
            catalog. Apache 2.0 license included.
          </p>
          <p>
            {template
              ? "Initialize a project, then run npx hyperframes preview in that folder."
              : snippet
                ? "Paste the installed snippet into your composition. Its styles and script are included."
                : "Add the markup above to your composition after installing."}
          </p>
          <details className="source-files">
            <summary>{details.item.files.length} installed files</summary>
            <ul>
              {details.item.files.map((file) => (
                <li key={file.path}>
                  <a
                    href={`/registry/blocks/${entry.item.name}/${file.path}`}
                    download
                  >
                    {file.target}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}

      {variables.length > 0 ? (
        <section className="detail-section variables-section">
          <div className="detail-section-heading">
            <div>
              <h2>Props</h2>
              <p>
                The installer bakes your current values in as the new defaults.
                You can keep changing them in HyperFrames.
              </p>
            </div>
          </div>
          <VariableTable variables={variables} values={effectiveValues} />
        </section>
      ) : null}

      {parity ? (
        <details
          className="verification-details"
          onToggle={(event) => setVerificationOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              Verified against {entry.source.label} ·{" "}
              {(parity.result.meanSsim * 100).toFixed(3)}% match
            </span>
            <span>{parity.result.frameCount} frames</span>
            <span aria-hidden="true">↓</span>
          </summary>
          {verificationOpen ? (
            <div className="verification-body">
              <div className="verification-copy">
                <p>
                  Synchronized renders of the pinned upstream source and this
                  HyperFrames port.
                </p>
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  Hyfrme source <span aria-hidden="true">↗</span>
                </a>
              </div>
              <Suspense
                fallback={
                  <div className="preview-loading">
                    Loading comparison player…
                  </div>
                }
              >
                <ComparisonPlayer
                  referenceLabel={entry.source.label}
                  referenceSrc={parity.artifacts.referenceVideo}
                  portSrc={parity.artifacts.hyperframesVideo}
                  square={
                    entry.item.dimensions?.width ===
                    entry.item.dimensions?.height
                  }
                />
              </Suspense>
            </div>
          ) : null}
        </details>
      ) : null}
    </>
  );
}
