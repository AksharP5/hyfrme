import { verifyRemocnPorts } from "./verify-text-ports.mjs";

await verifyRemocnPorts([...process.argv.slice(2), "--icon-showcase"], "icon");
