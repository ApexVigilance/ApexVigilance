// Removed reference to vite/client to fix "Cannot find type definition file" error
export const PROOF = "VITE_RUNNING_OK";
// Cast import.meta to any to fix "Property 'env' does not exist on type 'ImportMeta'" error
console.log("PROOF:", PROOF, "DEV=", (import.meta as any).env?.DEV);