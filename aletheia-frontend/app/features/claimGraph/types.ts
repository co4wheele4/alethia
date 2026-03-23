/**
 * ADR-021: Claim–Evidence Graph Integrity & Read-Only Topology
 *
 * Graph data shape: nodes and edges ONLY.
 * No inference, no derived metrics, no semantic fields.
 */

export type GraphNodeType = 'claim' | 'evidence';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  /** Claim text OR evidence identifier (id/snippet); no derived labels */
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface ClaimEvidenceGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
