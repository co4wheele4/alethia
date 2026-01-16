export type OnboardingStepId = 'welcome' | 'intake' | 'provenance' | 'review' | 'complete';

export type IntakeMode = 'file' | 'url';

export type ProvenanceType =
  | 'user-supplied'
  | 'scraped'
  | 'archive'
  | 'transcript'
  | 'public-record'
  | 'other'
  | 'unsure';

export type StagedItem =
  | {
      id: string;
      kind: 'file';
      file: File;
      title: string;
      provenance: {
        type: ProvenanceType | null;
        label: string;
        confirmed: boolean;
      };
    }
  | {
      id: string;
      kind: 'url';
      url: string;
      title: string;
      provenance: {
        type: ProvenanceType | null;
        label: string;
        confirmed: boolean;
      };
    };

export type ReviewPreview = {
  text: string;
  extractedTitle?: string;
  stats: {
    characters: number;
    words: number;
    lines: number;
    csvRows?: number;
    chunkCount: number;
  };
  urlMeta?: {
    fetchedUrl: string;
    contentType: string | null;
    publisher: string | null;
    publishedAtIso: string | null;
    author: string | null;
  };
  fileMeta?: {
    mimeType: string;
    sizeBytes: number;
    lastModifiedMs: number;
    fileSha256?: string | null;
  };
};

export type OnboardingState = {
  activeStep: OnboardingStepId;
  visited: Record<OnboardingStepId, boolean>;

  intakeMode: IntakeMode;
  staged: StagedItem[];

  urlDraft: { url: string; title: string };

  review: {
    previewsById: Record<string, ReviewPreview | undefined>;
    previewBusyById: Record<string, boolean | undefined>;
    previewErrorById: Record<string, string | undefined>;
    irreversibleConfirmed: boolean;
  };

  ingestion: {
    state: 'idle' | 'running' | 'done' | 'error';
    currentIndex: number;
    results: Array<{ stagedId: string; documentId: string }>;
    errorMessage?: string;
  };
};

