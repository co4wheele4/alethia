/**
 * ADR-021: Transform claims + evidence into read-only graph topology.
 *
 * Invariants enforced:
 * - Only Claim → Evidence edges (explicit ClaimEvidence links)
 * - No claim→claim, no evidence→evidence edges
 * - Labels: claim text OR evidence identifier only
 * - No derived fields (similarity, relatedClaims, etc.)
 */

import type { ClaimEvidenceGraphData, GraphEdge, GraphNode } from './types';

/** Evidence shape from Claim.evidence (schema-faithful) */
export type EvidenceInput = {
  id: string;
  snippet?: string | null;
};

/** Claim shape from ListClaims (schema-faithful) */
export type ClaimInput = {
  id: string;
  text: string;
  evidence: EvidenceInput[];
};

function evidenceLabel(ev: EvidenceInput): string {
  const snippet = ev.snippet?.trim();
  if (snippet && snippet.length > 0) return snippet;
  return ev.id;
}

/**
 * Build graph from claims with evidence.
 * Order preserved from backend; no reordering for "readability".
 */
export function claimsToGraph(claims: ClaimInput[]): ClaimEvidenceGraphData {
  const nodeIds = new Set<string>();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const claim of claims) {
    if (!Array.isArray(claim.evidence)) continue;

    // Claim node (dedup by id)
    if (!nodeIds.has(claim.id)) {
      nodeIds.add(claim.id);
      nodes.push({
        id: claim.id,
        type: 'claim',
        label: claim.text.trim() || claim.id,
      });
    }

    for (const ev of claim.evidence) {
      // Evidence node (dedup by id)
      if (!nodeIds.has(ev.id)) {
        nodeIds.add(ev.id);
        nodes.push({
          id: ev.id,
          type: 'evidence',
          label: evidenceLabel(ev),
        });
      }

      // Edge: claim → evidence only
      edges.push({ source: claim.id, target: ev.id });
    }
  }

  return { nodes, edges };
}
