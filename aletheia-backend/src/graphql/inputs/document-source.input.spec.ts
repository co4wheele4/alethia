import {
  CreateDocumentSourceInput,
  DocumentSourceKindInput,
  UpsertDocumentSourceInput,
} from './document-source.input';

describe('DocumentSource inputs', () => {
  it('should expose stable enum values', () => {
    expect(DocumentSourceKindInput.MANUAL).toBe('MANUAL');
    expect(DocumentSourceKindInput.FILE).toBe('FILE');
    expect(DocumentSourceKindInput.URL).toBe('URL');
  });

  it('should allow constructing inputs (decorators execute on import)', () => {
    const source = new CreateDocumentSourceInput();
    source.kind = DocumentSourceKindInput.MANUAL;
    source.publisher = 'Example Publisher';
    source.requestedUrl = 'https://example.com';

    const upsert = new UpsertDocumentSourceInput();
    upsert.documentId = '00000000-0000-0000-0000-000000000000';
    upsert.source = source;

    expect(upsert.documentId).toContain('-');
    expect(upsert.source.kind).toBe(DocumentSourceKindInput.MANUAL);
  });
});

