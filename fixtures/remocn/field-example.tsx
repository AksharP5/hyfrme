import { AbsoluteFill } from "remotion";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/registry/remocn-ui/field";

const controlStyle = {
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  border: "1px solid oklch(0.922 0 0)",
  borderRadius: 6,
  color: "oklch(0.145 0 0)",
  background: "oklch(1 0 0)",
  fontSize: 14,
};

export function HyfrmeFieldExampleScene() {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <FieldGroup
        gap={20}
        style={{
          width: 360,
          padding: 24,
          border: "1px solid oklch(0.922 0 0)",
          borderRadius: 10,
          background: "oklch(1 0 0)",
        }}
      >
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldControl>
            <div style={controlStyle}>you@example.com</div>
          </FieldControl>
          <FieldDescription>We will never share your email.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Password</FieldLabel>
          <FieldControl>
            <div style={controlStyle}>••••••••••••</div>
          </FieldControl>
        </Field>
      </FieldGroup>
    </AbsoluteFill>
  );
}
