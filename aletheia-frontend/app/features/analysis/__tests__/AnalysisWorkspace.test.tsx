import { render, screen, fireEvent, act } from '@testing-library/react';
import { AnalysisWorkspace } from '../components/AnalysisWorkspace';
import { useAskAi } from '../hooks/useAskAi';
import { useAiQueriesByUser } from '../hooks/useAiQueriesByUser';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../hooks/useAskAi');
vi.mock('../hooks/useAiQueriesByUser');
vi.mock('../../documents/hooks/useDocuments');

const mockUseAskAi = useAskAi as unknown as ReturnType<typeof vi.fn>;
const mockUseAiQueriesByUser = useAiQueriesByUser as unknown as ReturnType<typeof vi.fn>;
const mockUseDocuments = useDocuments as unknown as ReturnType<typeof vi.fn>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockDocs = [
  { id: 'd1', title: 'Doc One', createdAt: '2023-01-01T12:00:00Z' },
];

const mockQueries = [
  {
    id: 'q1',
    query: 'Previous Query',
    createdAt: '2023-01-01T12:00:00Z',
    results: [
      { id: 'r1', score: 0.9, answer: 'Historical Answer' }
    ]
  }
];

describe('AnalysisWorkspace', () => {
  const mockAsk = vi.fn();

  beforeEach(() => {
    mockUseAskAi.mockReturnValue({ ask: mockAsk, loading: false, error: null });
    mockUseAiQueriesByUser.mockReturnValue({ queries: mockQueries, loading: false, error: null });
    mockUseDocuments.mockReturnValue({ documents: mockDocs, loading: false, error: null });
  });

  it('renders correctly and handles questioning', async () => {
    mockAsk.mockResolvedValue({
      id: 'r2',
      score: 0.95,
      answer: 'New Answer',
      query: { id: 'q2', query: 'New Query', createdAt: new Date().toISOString() }
    });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('Analysis workspace')).toBeInTheDocument();
    expect(screen.getByText('Historical Answer')).toBeInTheDocument();

    const input = screen.getByLabelText(/Ask a question/i);
    fireEvent.change(input, { target: { value: 'New Query' } });

    const askBtn = screen.getByRole('button', { name: /Ask/i });
    await act(async () => {
      fireEvent.click(askBtn);
    });

    expect(mockAsk).toHaveBeenCalledWith('u1', 'New Query');
    expect(screen.getByText('New Answer')).toBeInTheDocument();
    // Prompt should be cleared
    expect(input).toHaveValue('');
  });

  it('sorts historical claims by date', () => {
    const multiQueries = [
      {
        id: 'q1',
        query: 'Old Query',
        createdAt: '2023-01-01T12:00:00Z',
        results: [{ id: 'r1', score: 0.8, answer: 'Old Answer' }]
      },
      {
        id: 'q2',
        query: 'New Query',
        createdAt: '2023-01-02T12:00:00Z',
        results: [{ id: 'r2', score: 0.9, answer: 'New Answer' }]
      }
    ];
    mockUseAiQueriesByUser.mockReturnValue({ queries: multiQueries, loading: false, error: null });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    const answers = screen.getAllByText(/Answer/);
    // Newest should be first in history
    expect(answers[0]).toHaveTextContent('New Answer');
    expect(answers[1]).toHaveTextContent('Old Answer');
  });

  it('renders ask error', async () => {
    mockUseAskAi.mockReturnValue({ 
      ask: mockAsk, 
      loading: false, 
      error: new Error('Ask failed') 
    });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('Ask failed')).toBeInTheDocument();
  });

  it('renders history error', () => {
    mockUseAiQueriesByUser.mockReturnValue({ 
      queries: [], 
      loading: false, 
      error: new Error('History failed') 
    });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('History failed')).toBeInTheDocument();
  });

  it('handles null query results in history mapping', () => {
    const queriesWithNullResults = [
      {
        id: 'q1',
        query: 'Query 1',
        createdAt: '2023-01-01T12:00:00Z',
        results: null
      }
    ];
    mockUseAiQueriesByUser.mockReturnValue({ 
      queries: queriesWithNullResults, 
      loading: false, 
      error: null 
    });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    // Should not crash and should show empty history
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getAllByText(/No AI outputs yet/i).length).toBeGreaterThan(0);
  });

  it('handles failed ask result', async () => {
    mockAsk.mockResolvedValue(null);

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/Ask a question/i);
    fireEvent.change(input, { target: { value: 'Query' } });

    const askBtn = screen.getByRole('button', { name: /Ask/i });
    await act(async () => {
      fireEvent.click(askBtn);
    });

    // Should not add to session claims
    expect(screen.queryByText('New Answer')).not.toBeInTheDocument();
  });

  it('renders asking state', () => {
    mockUseAskAi.mockReturnValue({ 
      ask: mockAsk, 
      loading: true, 
      error: null 
    });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('Asking…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asking…/i })).toBeDisabled();
  });

  it('renders loading states for documents', () => {
    mockUseDocuments.mockReturnValue({ documents: [], loading: true, error: null });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading documents/i)).toBeInTheDocument();
  });

  it('renders empty documents state', () => {
    mockUseDocuments.mockReturnValue({ documents: [], loading: false, error: null });

    render(
      <TestWrapper>
        <AnalysisWorkspace userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText(/No documents available/i)).toBeInTheDocument();
  });

  it('renders info when not logged in', () => {
    render(
      <TestWrapper>
        <AnalysisWorkspace userId={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Analysis workspace is available after login/i)).toBeInTheDocument();
  });
});
