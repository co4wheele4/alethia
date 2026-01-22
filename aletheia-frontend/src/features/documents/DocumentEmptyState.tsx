import React from 'react';

export function DocumentEmptyState() {
  return (
    <div role="status" aria-live="polite">
      <p>No documents found.</p>
    </div>
  );
}

