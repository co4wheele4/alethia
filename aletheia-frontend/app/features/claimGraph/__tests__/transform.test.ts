import { describe, expect, it } from 'vitest';
import { claimsToGraph } from '../transform';
import type { ClaimInput } from '../transform';

describe('claimsToGraph (ADR-021)', () => {
  it('produces only claim→evidence edges', () => {
    const claims: ClaimInput[] = [
      { id: 'c1', text: 'Claim A', evidence: [{ id: 'e1', snippet: 'Evidence X' }] },
      { id: 'c2', text: 'Claim B', evidence: [{ id: 'e1', snippet: 'Evidence X' }] },
      { id: 'c3', text: 'Claim C', evidence: [{ id: 'e2', snippet: 'Evidence Y' }] },
    ];
    const { nodes, edges } = claimsToGraph(claims);

    expect(nodes).toHaveLength(5);
    expect(edges).toHaveLength(3);

    const claimIds = new Set(nodes.filter((n) => n.type === 'claim').map((n) => n.id));
    const evidenceIds = new Set(nodes.filter((n) => n.type === 'evidence').map((n) => n.id));

    for (const e of edges) {
      expect(claimIds.has(e.source)).toBe(true);
      expect(evidenceIds.has(e.target)).toBe(true);
    }
  });

  it('never produces claim→claim or evidence→evidence edges', () => {
    const claims: ClaimInput[] = [
      { id: 'c1', text: 'A', evidence: [{ id: 'e1', snippet: 'X' }] },
      { id: 'c2', text: 'B', evidence: [{ id: 'e1', snippet: 'X' }] },
    ];
    const { edges } = claimsToGraph(claims);

    const claimIds = new Set(['c1', 'c2']);
    const evidenceIds = new Set(['e1']);

    for (const e of edges) {
      expect(claimIds.has(e.source) && evidenceIds.has(e.target)).toBe(true);
      expect(claimIds.has(e.source) && claimIds.has(e.target)).toBe(false);
      expect(evidenceIds.has(e.source) && evidenceIds.has(e.target)).toBe(false);
    }
  });

  it('uses claim text or evidence identifier for labels', () => {
    const claims: ClaimInput[] = [
      { id: 'c1', text: 'My claim', evidence: [{ id: 'e1', snippet: 'snippet' }] },
      { id: 'c2', text: 'Other', evidence: [{ id: 'e2', snippet: null }] },
    ];
    const { nodes } = claimsToGraph(claims);

    const claimNode = nodes.find((n) => n.id === 'c1');
    const evidenceWithSnippet = nodes.find((n) => n.id === 'e1');
    const evidenceWithoutSnippet = nodes.find((n) => n.id === 'e2');

    expect(claimNode?.label).toBe('My claim');
    expect(evidenceWithSnippet?.label).toBe('snippet');
    expect(evidenceWithoutSnippet?.label).toBe('e2');
  });
});
