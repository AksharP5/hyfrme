import { useEffect } from "react";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Component not found — Hyfrme";
  }, []);

  return (
    <section className="not-found">
      <span className="section-kicker">404</span>
      <h1>That component is not here.</h1>
      <a href="/components">Browse all components</a>
    </section>
  );
}
