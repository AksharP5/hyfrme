import { useEffect, useState } from "react";
import type { RegistrySummary } from "../catalog";
import {
  type CompositionVariable,
  type CustomValues,
  numberBounds,
  optionsFor,
  parseVariableValue,
} from "../lib/customization";
import { CopyButton } from "./CopyButton";

type CustomizerProps = {
  item: RegistrySummary;
  variables: CompositionVariable[];
  values: CustomValues;
  onChange: (id: string, value: string | number | boolean) => void;
  onReset: () => void;
  shareUrl: string;
};

type ControlProps = {
  item: RegistrySummary;
  variable: CompositionVariable;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
};

function NumberControl({ item, variable, value, onChange }: ControlProps) {
  const [draft, setDraft] = useState(String(value));
  const bounds = numberBounds(variable, item);

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const next = parseVariableValue(variable, draft);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <label
      className="control-row control-number"
      htmlFor={`control-${variable.id}`}
    >
      <span className="control-number-heading">
        <span>{variable.label}</span>
        <input
          type="number"
          value={draft}
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            const number = event.currentTarget.valueAsNumber;
            setDraft(raw);
            if (
              Number.isFinite(number) &&
              number !== value &&
              number === parseVariableValue(variable, raw)
            ) {
              onChange(number);
            }
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          aria-label={`${variable.label} value`}
        />
      </span>
      <input
        id={`control-${variable.id}`}
        type="range"
        value={Number(value)}
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </label>
  );
}

function VariableControl({ item, variable, value, onChange }: ControlProps) {
  const id = `control-${variable.id}`;

  if (variable.type === "boolean") {
    return (
      <label className="control-row control-toggle" htmlFor={id}>
        <span>{variable.label}</span>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true">
          <span />
        </span>
      </label>
    );
  }

  if (variable.type === "color") {
    return (
      <label className="control-row control-color" htmlFor={id}>
        <span>{variable.label}</span>
        <span>
          <code>{String(value).toUpperCase()}</code>
          <input
            id={id}
            type="color"
            value={String(value)}
            onInput={(event) => onChange(event.currentTarget.value)}
          />
        </span>
      </label>
    );
  }

  if (variable.type === "number") {
    return (
      <NumberControl
        item={item}
        variable={variable}
        value={value}
        onChange={onChange}
      />
    );
  }

  const options = optionsFor(variable);
  if (options) {
    return (
      <label className="control-row control-select" htmlFor={id}>
        <span>{variable.label}</span>
        <select
          id={id}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="control-row control-text" htmlFor={id}>
      <span>{variable.label}</span>
      {String(variable.default).includes("\n") ? (
        <textarea
          id={id}
          rows={4}
          maxLength={variable.maxLength}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type="text"
          maxLength={variable.maxLength}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function Customizer({
  item,
  variables,
  values,
  onChange,
  onReset,
  shareUrl,
}: CustomizerProps) {
  return (
    <section className="customizer" aria-labelledby="customizer-title">
      <div className="customizer-heading">
        <h2 id="customizer-title">Customize</h2>
        <div className="customizer-actions">
          <CopyButton
            value={shareUrl}
            label="Copy link"
            copiedLabel="Link copied"
          />
          <button type="button" onClick={onReset}>
            <span aria-hidden="true">↺</span> Reset
          </button>
        </div>
      </div>
      <div className="controls-grid">
        {variables.map((variable) => (
          <VariableControl
            key={variable.id}
            item={item}
            variable={variable}
            value={values[variable.id]}
            onChange={(value) => onChange(variable.id, value)}
          />
        ))}
      </div>
    </section>
  );
}
