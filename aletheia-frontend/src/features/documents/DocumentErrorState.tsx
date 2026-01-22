import React from 'react';

function errorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message || 'Error';
  return String(error);
}

export function DocumentErrorState(props: { error: unknown }) {
  return (
    <div role="alert">
      <p>Failed to load documents.</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{errorMessage(props.error)}</pre>
    </div>
  );
}

