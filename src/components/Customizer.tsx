import type { RegistryItem } from "../catalog";
import {
  type CompositionVariable,
  type CustomValues,
  numberBounds,
  optionsFor,
} from "../lib/customization";
import { CopyButton } from "./CopyButton";

type CustomizerProps = {
  item: RegistryItem;
  variables: CompositionVariable[];
  values: CustomValues;
  onChange: (id: string, value: string | number | boolean) => void;
  onReset: () => void;
  shareUrl: string;
};

type ControlProps = {
  item: RegistryItem;
  variable: CompositionVariable;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
};

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
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </label>
    );
  }

  if (variable.type === "number") {
    const bounds = numberBounds(variable, item);
    const numericValue = Number(value);
    return (
      <label className="control-row control-number" htmlFor={id}>
        <span className="control-number-heading">
          <span>{variable.label}</span>
          <input
            type="number"
            value={numericValue}
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-label={`${variable.label} value`}
          />
        </span>
        <input
          id={id}
          type="range"
          value={numericValue}
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
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
      <input
        id={id}
        type="text"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
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
        <div>
          <span className="section-kicker">Make it yours</span>
          <h2 id="customizer-title">Customize</h2>
        </div>
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
