import React from 'react';

import { DocumentRow, type DocumentCore } from './DocumentRow';

export function DocumentList(props: { documents: DocumentCore[] }) {
  return (
    <div role="list" aria-label="Documents">
      {props.documents.map((d) => (
        <DocumentRow key={d.id} document={d} />
      ))}
    </div>
  );
}

