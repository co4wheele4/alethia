'use client';

import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Link from 'next/link';
import Typography from '@mui/material/Typography';

export type WorkspaceEmptySurface =
  | 'documents'
  | 'claims'
  | 'evidence'
  | 'graph'
  | 'review-queue'
  | 'relationships';

export function WorkspaceEmptyHelp(props: { surface: WorkspaceEmptySurface; userRole?: string | null }) {
  const { surface, userRole } = props;
  const isAdminOrReviewer = userRole === 'ADMIN' || userRole === 'REVIEWER';

  const roleHint =
    isAdminOrReviewer && surface !== 'review-queue'
      ? ' As an admin or reviewer, you still only see documents and claims owned by the signed-in user unless you sign in as that user.'
      : '';

  const body: Record<WorkspaceEmptySurface, ReactNode> = {
    documents: (
      <>
        No documents in your workspace yet. Use Add sources above, or open{' '}
        <Link href="/claims">Claims</Link> after you have documents to attach claims to.
        {roleHint}
      </>
    ),
    claims: (
      <>
        No claims in your workspace. Claims are tied to documents you own and evidence. Open{' '}
        <Link href="/documents">Documents</Link> to ingest sources, then return here.{' '}
        <Link href="/evidence">Evidence</Link> lists documents you can inspect by chunk and entity.
        {roleHint}
      </>
    ),
    evidence: (
      <>
        No documents in your workspace yet. Evidence is organized per document — ingest from{' '}
        <Link href="/documents?ingest=1">Documents</Link> or review grounded claims under{' '}
        <Link href="/claims">Claims</Link>.
        {roleHint}
      </>
    ),
    graph: (
      <>
        Nothing to graph in this scope. The view needs at least one claim with linked evidence on documents you own. Use{' '}
        <Link href="/claims">Claims</Link> or open a document’s evidence from{' '}
        <Link href="/evidence">Evidence</Link>.
        {roleHint}
      </>
    ),
    'review-queue': (
      <>
        The review queue is empty: nothing is awaiting coordination right now. When authors request review, items appear
        here for assignment and handoff (coordination), not for adjudication outcomes.
      </>
    ),
    relationships: (
      <>
        No relationships returned. After seeding or ingestion, relationships appear when they are stored with inspectable
        evidence anchors. See{' '}
        <Link href="/documents">Documents</Link> for per-document relationship lists when available.
      </>
    ),
  };

  return (
    <Alert severity="info" sx={{ mt: 1 }}>
      <Typography variant="body2" component="div">
        {body[surface]}
      </Typography>
    </Alert>
  );
}
