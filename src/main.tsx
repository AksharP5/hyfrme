import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

function redactCustomizationValues<T extends { url: string }>(event: T): T {
  const url = new URL(event.url);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("v.")) url.searchParams.delete(key);
  }
  return { ...event, url: url.toString() };
}

createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <App />
    </StrictMode>
    <Analytics beforeSend={redactCustomizationValues} />
    <SpeedInsights beforeSend={redactCustomizationValues} />
  </>,
);
