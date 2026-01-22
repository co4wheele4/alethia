import React from 'react';

export type DocumentCore = {
  __typename?: 'Document';
  id: string;
  title: string;
  sourceType: string | null;
  createdAt: string;
};

export function DocumentRow(props: { document: DocumentCore }) {
  const d = props.document;
  return (
    <div role="listitem" data-document-id={d.id}>
      <div>{d.title}</div>
      <div>{d.sourceType ?? ''}</div>
      <div>{d.createdAt}</div>
    </div>
  );
}

