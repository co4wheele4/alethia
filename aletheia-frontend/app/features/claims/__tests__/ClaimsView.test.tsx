import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClaimsView } from '../components/ClaimsView';

import * as docsHook from '../../documents/hooks/useDocuments';
import * as claimsHook from '../hooks/useClaims';

vi.mock('../../documents/hooks/useDocuments');
vi.mock('../hooks/useClaims');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('ClaimsView', () => {
  it('shows login-gated message when userId is null', () => {
    vi.mocked(docsHook.useDocuments).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      isBusy: false,
      createDocument: vi.fn(),
      deleteDocument: vi.fn(),
      refetch: vi.fn(),
    });

    vi.mocked(claimsHook.useClaims).mockReturnValue({
      claims: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ClaimsView userId={null} />);
    expect(screen.getByText(/available after login/i)).toBeInTheDocument();
  });

  it('renders list, opens drawer, and can jump to evidence', async () => {
    vi.mocked(docsHook.useDocuments).mockReturnValue({
      documents: [
        { id: 'doc_1', title: 'Doc 1', createdAt: '2026-01-01T00:00:00.000Z', __typename: 'Document' },
      ],
      loading: false,
      error: null,
      isBusy: false,
      createDocument: vi.fn(),
      deleteDocument: vi.fn(),
      refetch: vi.fn(),
    });

    const claim = {
      id: 'c1',
      text: 'Claim text',
      status: 'DRAFT',
      createdAt: '2026-01-02T00:00:00.000Z',
      documents: [{ id: 'doc_1', title: 'Doc 1', sourceLabel: 'src', __typename: 'Document' }],
      evidence: [
        {
          id: 'ev1',
          sourceDocumentId: 'doc_1',
          chunkId: 'chunk_1',
          startOffset: 0,
          endOffset: 5,
          snippet: 'Claim',
          createdAt: '2026-01-02T00:00:00.000Z',
          createdBy: 'u1',
          sourceType: 'DOCUMENT',
          __typename: 'Evidence',
        },
      ],
      __typename: 'Claim',
    };

    vi.mocked(claimsHook.useClaims).mockImplementation(() => ({
      claims: [claim as any],
      loading: false,
      error: null,
      refetch: vi.fn(),
    }));

    const user = userEvent.setup();
    render(<ClaimsView userId="u1" />);

    const list = screen.getByRole('list', { name: 'claims-list' });
    await user.click(within(list).getByText(/Claim text/i));

    expect(screen.getByLabelText('Claim detail drawer')).toBeInTheDocument();
    const jump = screen.getByRole('link', { name: /jump to evidence/i });
    expect(jump).toHaveAttribute('href', '/documents/doc_1?chunkId=chunk_1');

    // Exercise claim drawer close handler for coverage.
    await user.click(screen.getByRole('button', { name: /close claim drawer/i }));
    expect(screen.getByText(/Select a claim to inspect/i)).toBeInTheDocument();

    // Exercise scope change handler (Select.onChange) for coverage.
    await user.click(screen.getByRole('combobox', { name: 'Scope' }));
    await user.click(screen.getByRole('option', { name: 'Doc 1' }));
  });

  it('renders loading + error states when provided by hooks', () => {
    vi.mocked(docsHook.useDocuments).mockReturnValue({
      documents: [],
      loading: true,
      error: new Error('docs error'),
      isBusy: false,
      createDocument: vi.fn(),
      deleteDocument: vi.fn(),
      refetch: vi.fn(),
    });

    vi.mocked(claimsHook.useClaims).mockReturnValue({
      claims: [],
      loading: true,
      error: new Error('claims error'),
      refetch: vi.fn(),
    });

    render(<ClaimsView userId="u1" />);
    expect(screen.getByText(/docs error/i)).toBeInTheDocument();
    expect(screen.getByText(/claims error/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});

