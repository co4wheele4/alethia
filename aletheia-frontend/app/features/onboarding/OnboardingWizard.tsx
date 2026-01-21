'use client';

import { useCallback, useMemo, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Step,
  StepButton,
  Stepper,
  Typography,
} from '@mui/material';

import { useAuth } from '../auth/hooks/useAuth';
import { getUserIdFromToken } from '../auth/utils/jwt';
import { importUrlToText } from '../documents/ingestion/urlImport';
import { parseFileToText } from '../documents/ingestion/fileParsers';
import { IngestionStatusStepper } from '../documents/components/IngestionStatusStepper';
import { useIngestDocuments, splitIntoChunks } from '../documents/hooks/useIngestDocuments';
import type { OnboardingState, OnboardingStepId, ReviewPreview, StagedItem } from './types';
import { WelcomeStep } from './steps/WelcomeStep';
import { IntakeStep } from './steps/IntakeStep';
import { ProvenanceStep } from './steps/ProvenanceStep';
import { ReviewStep } from './steps/ReviewStep';
import { CompletionStep } from './steps/CompletionStep';

const ORDER: OnboardingStepId[] = ['welcome', 'intake', 'provenance', 'review', 'complete'];

function nextOf(step: OnboardingStepId): OnboardingStepId {
  const idx = ORDER.indexOf(step);
  return ORDER[Math.min(idx + 1, ORDER.length - 1)]!;
}
function prevOf(step: OnboardingStepId): OnboardingStepId {
  const idx = ORDER.indexOf(step);
  return ORDER[Math.max(idx - 1, 0)]!;
}

function newId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function sha256HexOfFile(file: File): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const buf = await file.arrayBuffer();
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function statsFor(text: string, opts: { kind: 'file' | 'url'; filename?: string | null }) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const characters = normalized.length;
  const lines = normalized ? normalized.split('\n').length : 0;
  const words = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
  const chunkCount = splitIntoChunks(normalized).length;

  const isCsv = (opts.filename ?? '').toLowerCase().endsWith('.csv');
  const csvRows = isCsv && normalized ? normalized.split('\n').filter((l) => l.trim().length > 0).length : undefined;

  return { characters, lines, words, chunkCount, csvRows };
}

type Action =
  | { type: 'NAVIGATE'; step: OnboardingStepId }
  | { type: 'SET_INTAKE_MODE'; mode: OnboardingState['intakeMode'] }
  | { type: 'SET_URL_DRAFT'; url: string; title: string }
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'ADD_URL' }
  | { type: 'REMOVE_STAGED'; id: string }
  | { type: 'SET_ITEM_TITLE'; id: string; title: string }
  | { type: 'SET_ITEM_PROVENANCE'; id: string; provenance: StagedItem['provenance'] }
  | { type: 'SET_REVIEW_IRREVERSIBLE'; value: boolean }
  | { type: 'PREVIEW_BUSY'; id: string; busy: boolean }
  | { type: 'PREVIEW_ERROR'; id: string; message: string | null }
  | { type: 'SET_PREVIEW'; id: string; preview: ReviewPreview }
  | { type: 'INGESTION_START' }
  | { type: 'INGESTION_PROGRESS'; currentIndex: number }
  | { type: 'INGESTION_DONE'; results: Array<{ stagedId: string; documentId: string }> }
  | { type: 'INGESTION_ERROR'; message: string };

const INITIAL: OnboardingState = {
  activeStep: 'welcome',
  visited: { welcome: true, intake: false, provenance: false, review: false, complete: false },
  intakeMode: 'file',
  staged: [],
  urlDraft: { url: '', title: '' },
  review: { previewsById: {}, previewBusyById: {}, previewErrorById: {}, irreversibleConfirmed: false },
  ingestion: { state: 'idle', currentIndex: 0, results: [] },
};

export function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'NAVIGATE': {
      return {
        ...state,
        activeStep: action.step,
        visited: { ...state.visited, [action.step]: true },
      };
    }
    case 'SET_INTAKE_MODE': {
      return { ...state, intakeMode: action.mode };
    }
    case 'SET_URL_DRAFT': {
      return { ...state, urlDraft: { url: action.url, title: action.title } };
    }
    case 'ADD_FILES': {
      const next: StagedItem[] = [
        ...state.staged,
        ...action.files.map((file) => ({
          id: newId(),
          kind: 'file' as const,
          file,
          title: (file.name ?? '').replace(/\.[^.]+$/, ''),
          provenance: { type: null, label: '', confirmed: false },
        })),
      ];
      return { ...state, staged: next };
    }
    case 'ADD_URL': {
      const url = state.urlDraft.url.trim();
      if (!url) return state;
      const title = state.urlDraft.title.trim() || url;
      const next: StagedItem[] = [
        ...state.staged,
        { id: newId(), kind: 'url', url, title, provenance: { type: null, label: '', confirmed: false } },
      ];
      return { ...state, staged: next, urlDraft: { url: '', title: '' } };
    }
    case 'REMOVE_STAGED': {
      const staged = state.staged.filter((s) => s.id !== action.id);
      const previewsById = { ...state.review.previewsById };
      const previewBusyById = { ...state.review.previewBusyById };
      const previewErrorById = { ...state.review.previewErrorById };
      delete previewsById[action.id];
      delete previewBusyById[action.id];
      delete previewErrorById[action.id];
      return { ...state, staged, review: { ...state.review, previewsById, previewBusyById, previewErrorById } };
    }
    case 'SET_ITEM_TITLE': {
      return {
        ...state,
        staged: state.staged.map((s) => (s.id === action.id ? { ...s, title: action.title } : s)),
      };
    }
    case 'SET_ITEM_PROVENANCE': {
      return {
        ...state,
        staged: state.staged.map((s) => (s.id === action.id ? { ...s, provenance: action.provenance } : s)),
      };
    }
    case 'SET_REVIEW_IRREVERSIBLE': {
      return { ...state, review: { ...state.review, irreversibleConfirmed: action.value } };
    }
    case 'PREVIEW_BUSY': {
      return {
        ...state,
        review: { ...state.review, previewBusyById: { ...state.review.previewBusyById, [action.id]: action.busy } },
      };
    }
    case 'PREVIEW_ERROR': {
      return {
        ...state,
        review: {
          ...state.review,
          previewErrorById: { ...state.review.previewErrorById, [action.id]: action.message ?? undefined },
        },
      };
    }
    case 'SET_PREVIEW': {
      return {
        ...state,
        review: { ...state.review, previewsById: { ...state.review.previewsById, [action.id]: action.preview } },
      };
    }
    case 'INGESTION_START': {
      return { ...state, ingestion: { state: 'running', currentIndex: 0, results: [] } };
    }
    case 'INGESTION_PROGRESS': {
      return { ...state, ingestion: { ...state.ingestion, state: 'running', currentIndex: action.currentIndex } };
    }
    case 'INGESTION_DONE': {
      return { ...state, ingestion: { state: 'done', currentIndex: state.staged.length, results: action.results } };
    }
    case 'INGESTION_ERROR': {
      return { ...state, ingestion: { ...state.ingestion, state: 'error', errorMessage: action.message } };
    }
    default:
      return state;
  }
}

export function OnboardingWizard() {
  const router = useRouter();
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);
  const { canIngest, progress, ingestOne, reset } = useIngestDocuments(userId);

  const [state, dispatch] = useReducer(reducer, INITIAL);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ingestionLocked = state.ingestion.state === 'running' || progress.state === 'running';

  const activeIndex = ORDER.indexOf(state.activeStep);

  const go = useCallback(
    (step: OnboardingStepId) => {
      if (ingestionLocked) return;
      dispatch({ type: 'NAVIGATE', step });
    },
    [ingestionLocked]
  );

  const onNext = useCallback(() => go(nextOf(state.activeStep)), [go, state.activeStep]);
  const onBack = useCallback(() => go(prevOf(state.activeStep)), [go, state.activeStep]);
  const onSkip = useCallback(() => onNext(), [onNext]);

  const generatePreview = useCallback(
    async (id: string) => {
      const item = state.staged.find((s) => s.id === id);
      if (!item) return;

      dispatch({ type: 'PREVIEW_ERROR', id, message: null });
      dispatch({ type: 'PREVIEW_BUSY', id, busy: true });
      try {
        if (item.kind === 'file') {
          const fileSha256 = await sha256HexOfFile(item.file);
          const parsed = await parseFileToText(item.file);
          const text = parsed.text ?? '';
          const preview: ReviewPreview = {
            text,
            extractedTitle: parsed.title,
            stats: statsFor(text, { kind: 'file', filename: item.file.name }),
            fileMeta: {
              mimeType: item.file.type || 'application/octet-stream',
              sizeBytes: item.file.size,
              lastModifiedMs: item.file.lastModified,
              fileSha256,
            },
          };
          dispatch({ type: 'SET_PREVIEW', id, preview });
          if (!item.title.trim() && parsed.title) {
            dispatch({ type: 'SET_ITEM_TITLE', id, title: parsed.title });
          }
        } else {
          const imported = await importUrlToText(item.url);
          const preview: ReviewPreview = {
            text: imported.text ?? '',
            extractedTitle: imported.title,
            stats: statsFor(imported.text ?? '', { kind: 'url' }),
            urlMeta: {
              fetchedUrl: imported.fetchedUrl,
              contentType: imported.contentType,
              publisher: imported.publisher,
              publishedAtIso: imported.publishedAtIso,
              author: imported.author,
            },
          };
          dispatch({ type: 'SET_PREVIEW', id, preview });
          if (!item.title.trim() && imported.title) {
            dispatch({ type: 'SET_ITEM_TITLE', id, title: imported.title });
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Preview failed.';
        dispatch({ type: 'PREVIEW_ERROR', id, message: msg });
      } finally {
        dispatch({ type: 'PREVIEW_BUSY', id, busy: false });
      }
    },
    [state.staged]
  );

  const commitIngestion = useCallback(async () => {
    if (!canIngest) {
      dispatch({ type: 'INGESTION_ERROR', message: 'You must be logged in to ingest documents.' });
      return;
    }
    if (state.staged.length === 0) {
      // Nothing to ingest; still allow completion.
      go('complete');
      return;
    }

    const missingPreview = state.staged.find((s) => !state.review.previewsById[s.id]);
    if (missingPreview) {
      dispatch({ type: 'INGESTION_ERROR', message: 'Generate a preview for every queued item before committing.' });
      return;
    }
    const unconfirmedProvenance = state.staged.find((s) => Boolean(s.provenance.type) && !s.provenance.confirmed);
    if (unconfirmedProvenance) {
      dispatch({
        type: 'INGESTION_ERROR',
        message: 'For any source with a provenance type selected, check the confirmation box before committing.',
      });
      return;
    }
    if (!state.review.irreversibleConfirmed) {
      dispatch({ type: 'INGESTION_ERROR', message: 'Confirm ingestion is irreversible before committing.' });
      return;
    }

    dispatch({ type: 'INGESTION_START' });
    reset();

    const results: Array<{ stagedId: string; documentId: string }> = [];
    try {
      for (let i = 0; i < state.staged.length; i += 1) {
        const item = state.staged[i]!;
        dispatch({ type: 'INGESTION_PROGRESS', currentIndex: i });
        reset();

        const preview = state.review.previewsById[item.id]!;
        const title =
          item.title.trim() ||
          (preview.extractedTitle ?? '').trim() ||
          (item.kind === 'file' ? item.file.name : item.url);
        const provType = item.provenance.type ?? undefined;
        const provLabel = item.provenance.label.trim() || undefined;
        const provConfirmed = item.provenance.confirmed || undefined;

        if (item.kind === 'file') {
          const res = await ingestOne({
            title,
            source: {
              kind: 'file',
              filename: item.file.name,
              mimeType: item.file.type || 'application/octet-stream',
              sizeBytes: item.file.size,
              lastModifiedMs: item.file.lastModified,
              fileSha256: preview.fileMeta?.fileSha256 ?? undefined,
              provenanceType: provType,
              provenanceLabel: provLabel,
              provenanceConfirmed: provConfirmed,
            },
            text: preview.text,
          });
          if (!res?.documentId) throw new Error('File ingestion failed.');
          results.push({ stagedId: item.id, documentId: res.documentId });
          continue;
        }

        const accessedAtIso = new Date().toISOString();
        const res = await ingestOne({
          title,
          source: {
            kind: 'url',
            url: item.url,
            accessedAtIso,
            fetchedUrl: preview.urlMeta?.fetchedUrl,
            contentType: preview.urlMeta?.contentType,
            publisher: preview.urlMeta?.publisher,
            publishedAtIso: preview.urlMeta?.publishedAtIso,
            author: preview.urlMeta?.author,
            provenanceType: provType,
            provenanceLabel: provLabel,
            provenanceConfirmed: provConfirmed,
          },
          text: preview.text,
        });
        if (!res?.documentId) throw new Error('URL ingestion failed.');
        results.push({ stagedId: item.id, documentId: res.documentId });
      }

      dispatch({ type: 'INGESTION_DONE', results });
      go('complete');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ingestion failed.';
      dispatch({ type: 'INGESTION_ERROR', message: msg });
    }
  }, [canIngest, go, ingestOne, reset, state.review, state.staged]);

  const header = useMemo(() => {
    if (!canIngest) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          You must be logged in to ingest documents. You can still read the orientation steps.
        </Alert>
      );
    }
    return null;
  }, [canIngest]);

  const ingestProgressNode = useMemo(() => {
    if (state.ingestion.state !== 'running') return null;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Ingesting {Math.min(state.ingestion.currentIndex + 1, Math.max(state.staged.length, 1))}/{Math.max(
            state.staged.length,
            1
          )}
        </Typography>
        <IngestionStatusStepper progress={progress} />
      </Box>
    );
  }, [progress, state.ingestion.currentIndex, state.ingestion.state, state.staged.length]);

  const body = (() => {
    if (state.activeStep === 'welcome') return <WelcomeStep />;
    if (state.activeStep === 'intake')
      return (
        <IntakeStep
          mode={state.intakeMode}
          staged={state.staged}
          urlDraft={state.urlDraft}
          fileInputRef={fileInputRef}
          disabled={ingestionLocked}
          onModeChange={(mode) => dispatch({ type: 'SET_INTAKE_MODE', mode })}
          onAddFiles={(files) => dispatch({ type: 'ADD_FILES', files: Array.from(files) })}
          onRemoveStaged={(id) => dispatch({ type: 'REMOVE_STAGED', id })}
          onUrlDraftChange={(draft) => dispatch({ type: 'SET_URL_DRAFT', url: draft.url, title: draft.title })}
          onAddUrl={() => dispatch({ type: 'ADD_URL' })}
        />
      );
    if (state.activeStep === 'provenance')
      return (
        <ProvenanceStep
          staged={state.staged}
          disabled={ingestionLocked}
          onSetItemProvenance={(id, provenance) => dispatch({ type: 'SET_ITEM_PROVENANCE', id, provenance })}
        />
      );
    if (state.activeStep === 'review')
      return (
        <ReviewStep
          staged={state.staged}
          review={state.review}
          ingestion={state.ingestion}
          ingestProgressNode={ingestProgressNode}
          disabled={ingestionLocked}
          onUpdateItemTitle={(id, title) => dispatch({ type: 'SET_ITEM_TITLE', id, title })}
          onSetItemProvenance={(id, provenance) => dispatch({ type: 'SET_ITEM_PROVENANCE', id, provenance })}
          onRemoveStaged={(id) => dispatch({ type: 'REMOVE_STAGED', id })}
          onGeneratePreview={(id) => void generatePreview(id)}
          onSetIrreversibleConfirmed={(value) => dispatch({ type: 'SET_REVIEW_IRREVERSIBLE', value })}
          onCommitIngestion={() => void commitIngestion()}
        />
      );

    const createdIds = state.ingestion.results.map((r) => r.documentId);
    return <CompletionStep createdDocumentIds={createdIds} />;
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {header}

      <Stepper nonLinear activeStep={activeIndex} aria-label="onboarding steps">
        {ORDER.map((stepId, idx) => {
          const label =
            stepId === 'welcome'
              ? 'Welcome'
              : stepId === 'intake'
                ? 'Document intake'
                : stepId === 'provenance'
                  ? 'Provenance'
                  : stepId === 'review'
                    ? 'Review'
                    : 'Complete';

          return (
            <Step key={stepId} completed={Boolean(state.visited[stepId]) && idx < activeIndex}>
              <StepButton
                onClick={() => go(stepId)}
                disabled={ingestionLocked}
                aria-label={`go to ${label}`}
              >
                {label}
              </StepButton>
            </Step>
          );
        })}
      </Stepper>

      <Box>{body}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={onBack} disabled={ingestionLocked || state.activeStep === 'welcome'} sx={{ textTransform: 'none' }}>
            Back
          </Button>
          <Button onClick={onSkip} disabled={ingestionLocked || state.activeStep === 'complete'} sx={{ textTransform: 'none' }}>
            Skip step
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {state.activeStep !== 'complete' ? (
            <Button variant="contained" onClick={onNext} disabled={ingestionLocked} sx={{ textTransform: 'none' }}>
              Next
            </Button>
          ) : (
            <Button
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={() => router.push('/documents')}
              disabled={ingestionLocked}
            >
              Open Documents
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

