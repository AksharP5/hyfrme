import assert from "node:assert/strict";
import { verifyFreshRemocn } from "./verify-remocn-fresh.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: REMOCN_SOURCE=<pristine pinned checkout> node scripts/verify-agent-run-fresh.mjs [--resume]\nRuns the shared exact fresh-page Remocn verifier for Agent Run while retaining its complete full-check and sequential CLI evidence.",
  );
  process.exit(0);
}
assert(
  args.every((argument) => argument === "--resume") && args.length <= 1,
  "Specify --resume once; no other verification arguments are supported",
);
await verifyFreshRemocn({
  only: "agent-run",
  resume: args.includes("--resume"),
  prepare: false,
});
