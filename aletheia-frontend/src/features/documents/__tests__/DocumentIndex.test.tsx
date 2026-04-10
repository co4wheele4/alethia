import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { execute } from '@apollo/client';
import { graphql, HttpResponse } from 'msw';
import { parse, Kind, type DocumentNode } from 'graphql';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as rxjsConfig } from 'rxjs';

import { server } from '@/app/lib/test-utils/server';
import { createApolloClient } from '@/app/services/apollo-client';
import { fixture } from '@/src/mocks/aletheia-fixtures';
import { DOCUMENT_CORE_FRAGMENT, DOCUMENTS_INDEX_QUERY } from '@/src/graphql';

import { DocumentIndex } from '../DocumentIndex';

function fragmentFieldNames(doc: DocumentNode, fragmentName: string): string[] {
  const def = doc.definitions.find(
    (d): d is Extract<typeof d, { kind: typeof Kind.FRAGMENT_DEFINITION }> =>
      d.kind === Kind.FRAGMENT_DEFINITION && d.name.value === fragmentName
  );
  if (!def) throw new Error(`Missing fragment definition "${fragmentName}"`);
  return def.selectionSet.selections.map((sel) => {
    if (sel.kind !== Kind.FIELD) throw new Error(`Fragment "${fragmentName}" must contain only field selections`);
    if (sel.selectionSet) throw new Error(`Fragment "${fragmentName}" must not contain nested selections`);
    return sel.name.value;
  });
}

describe('DocumentIndex (read-only)', () => {
  it('renders loading then documents', async () => {
    server.use(
      graphql.query('DocumentsIndex', async () => {
        await new Promise<void>((r) => setTimeout(r, 25));
        const data = {
          documents: fixture.documents.map((d) => ({
            __typename: d.__typename,
            id: d.id,
            title: d.title,
            sourceType: d.sourceType,
            createdAt: d.createdAt,
          })),
        };
        return HttpResponse.json({ data });
      })
    );

    const client = createApolloClient();
    render(
      <ApolloProvider client={client}>
        <DocumentIndex />
      </ApolloProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading documents');
    expect(await screen.findByText(fixture.documents[0].title)).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    server.use(
      graphql.query('DocumentsIndex', () => {
        return HttpResponse.json({ data: { documents: [] } });
      })
    );

    const client = createApolloClient();
    render(
      <ApolloProvider client={client}>
        <DocumentIndex />
      </ApolloProvider>
    );

    expect(await screen.findByText('No documents found.')).toBeInTheDocument();
  });

  it('renders error state when GraphQL returns errors', async () => {
    server.use(
      graphql.query('DocumentsIndex', () => {
        return HttpResponse.json({ errors: [{ message: 'boom' }] }, { status: 200 });
      })
    );

    const client = createApolloClient();
    render(
      <ApolloProvider client={client}>
        <DocumentIndex />
      </ApolloProvider>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load documents.');
  });

  it('fails the operation if a response includes a confidence field', async () => {
    server.use(
      graphql.query('DocumentsIndex', () => {
        const data = {
          documents: [
            {
              __typename: 'Document',
              id: 'doc_bad',
              title: 'Bad',
              sourceType: 'URL',
              createdAt: fixture.documents[0].createdAt,
              confidence: 0.5,
            },
          ],
        };
        return HttpResponse.json({ data });
      })
    );

    const prevUnhandled = rxjsConfig.onUnhandledError;
    const unhandled: unknown[] = [];
    rxjsConfig.onUnhandledError = (err) => {
      unhandled.push(err);
    };

    const client = createApolloClient();

    try {
      const sub = execute(
        client.link,
        { query: DOCUMENTS_INDEX_QUERY, variables: { limit: 500, offset: 0 } },
        { client },
      ).subscribe({
        next: () => {},
        error: () => {},
        complete: () => {},
      });

      // Let the link emit, then let RxJS flush its unhandled error callback.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      sub.unsubscribe();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const msg = unhandled
        .map((e) => String((e as { message?: unknown } | null | undefined)?.message ?? e))
        .join('\n');
      expect(msg).toMatch(/confidence/i);
    } finally {
      rxjsConfig.onUnhandledError = prevUnhandled;
    }
  });

  it('keeps DocumentCore.fragment.graphql in sync with the exported DocumentNode', () => {
    const p = path.join(process.cwd(), 'src/graphql/fragments/DocumentCore.fragment.graphql');
    const sdl = readFileSync(p, 'utf-8');

    const fileDoc = parse(sdl);
    const fileFields = fragmentFieldNames(fileDoc, 'DocumentCore');
    const tsFields = fragmentFieldNames(DOCUMENT_CORE_FRAGMENT, 'DocumentCore');

    expect(fileFields).toEqual(tsFields);
  });
});

