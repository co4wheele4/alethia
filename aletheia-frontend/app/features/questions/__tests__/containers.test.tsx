import { render, screen } from '@testing-library/react';
import { QuestionEntityConstraintsQueryContainer } from '../components/QuestionEntityConstraintsQueryContainer';
import { QuestionScopeDocumentsQueryContainer } from '../components/QuestionScopeDocumentsQueryContainer';
import { useEntities } from '../../entities/hooks/useEntities';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { vi } from 'vitest';

vi.mock('../../entities/hooks/useEntities', () => ({
  useEntities: vi.fn(),
}));

vi.mock('../../documents/hooks/useDocuments', () => ({
  useDocuments: vi.fn(),
}));

const mockUseEntities = vi.mocked(useEntities);
const mockUseDocuments = vi.mocked(useDocuments);

describe('Questions Containers', () => {
  describe('QuestionEntityConstraintsQueryContainer', () => {
    it('renders children with entities state', () => {
      mockUseEntities.mockReturnValue({
        entities: [{ id: 'e1', name: 'E1', type: 'Person', mentionCount: 1 }],
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QuestionEntityConstraintsQueryContainer>
          {({ entities }) => (
            <div>{entities.map(e => e.name).join(',')}</div>
          )}
        </QuestionEntityConstraintsQueryContainer>
      );

      expect(screen.getByText('E1')).toBeInTheDocument();
    });
  });

  describe('QuestionScopeDocumentsQueryContainer', () => {
    it('renders children with documents state', () => {
      mockUseDocuments.mockReturnValue({
        documents: [{ id: 'd1', title: 'D1' }],
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QuestionScopeDocumentsQueryContainer userId="u1">
          {({ documents }) => (
            <div>{documents.map(d => d.title).join(',')}</div>
          )}
        </QuestionScopeDocumentsQueryContainer>
      );

      expect(screen.getByText('D1')).toBeInTheDocument();
      expect(mockUseDocuments).toHaveBeenCalledWith('u1');
    });
  });
});