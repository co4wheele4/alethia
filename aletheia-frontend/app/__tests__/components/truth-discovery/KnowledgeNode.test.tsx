/**
 * Tests for KnowledgeNode component
 */

import { render, screen } from '@testing-library/react';
import { KnowledgeNode } from '../../../components/truth-discovery/KnowledgeNode';

describe('KnowledgeNode', () => {
  it('should render placeholder text', () => {
    render(<KnowledgeNode />);
    expect(screen.getByText('KnowledgeNode - TODO: Implement')).toBeInTheDocument();
  });

  it('should work with props', () => {
    render(<KnowledgeNode nodeId="node1" label="Test Node" />);
    expect(screen.getByText('KnowledgeNode - TODO: Implement')).toBeInTheDocument();
  });
});
