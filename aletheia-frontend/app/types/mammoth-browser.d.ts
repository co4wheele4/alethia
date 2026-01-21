// Minimal type declarations for mammoth's browser bundle.
// This file exists because `mammoth/mammoth.browser` does not ship TypeScript types.
// We keep the surface area narrow: only what we actually use for ingestion.
declare module 'mammoth/mammoth.browser' {
  export type ExtractRawTextResult = {
    value: string;
    messages: Array<{ type: string; message: string }>;
  };

  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractRawTextResult>;
}

