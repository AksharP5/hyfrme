import type { CompositionVariable, CustomValues } from "../lib/customization";

type VariableTableProps = {
  variables: CompositionVariable[];
  values: CustomValues;
};

function formatValue(value: string | number | boolean) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

export function VariableTable({ variables, values }: VariableTableProps) {
  return (
    <div className="variable-table-shell">
      <table className="variable-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Type</th>
            <th>Default</th>
            <th>Current value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => {
            const current = values[variable.id];
            const changed = current !== variable.default;
            return (
              <tr key={variable.id}>
                <td>
                  <code>{variable.id}</code>
                  <span>{variable.label}</span>
                </td>
                <td>
                  <code>{variable.type}</code>
                </td>
                <td>
                  <code>{formatValue(variable.default)}</code>
                </td>
                <td>
                  <code data-customized={changed ? "true" : "false"}>
                    {formatValue(current)}
                  </code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
