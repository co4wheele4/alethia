'use client';

import React from 'react';
import { useQuery } from '@apollo/client/react';

import { DOCUMENTS_INDEX_QUERY } from '@/src/graphql';

import { DocumentEmptyState } from './DocumentEmptyState';
import { DocumentErrorState } from './DocumentErrorState';
import { DocumentList } from './DocumentList';
import type { DocumentCore } from './DocumentRow';

type DocumentsIndexData = {
  documents: DocumentCore[];
};

export function DocumentIndex() {
  const { data, loading, error } = useQuery<DocumentsIndexData>(DOCUMENTS_INDEX_QUERY);

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        Loading documents…
      </div>
    );
  }

  if (error) {
    return <DocumentErrorState error={error} />;
  }

  const documents = data?.documents ?? [];
  if (documents.length === 0) {
    return <DocumentEmptyState />;
  }

  return <DocumentList documents={documents} />;
}

