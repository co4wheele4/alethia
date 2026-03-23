/**
 * ADR-021: Read-only graph renderer.
 *
 * Invariants:
 * - All nodes rendered uniformly (no highlight, no "primary")
 * - All edges rendered uniformly
 * - No clustering, no auto-grouping
 * - Layout: simple circular (deterministic, no semantic meaning to position)
 */

'use client';

import { useMemo } from 'react';
import { Box } from '@mui/material';
import Link from 'next/link';
import type { ClaimEvidenceGraphData } from '../types';

const NODE_R = 24;
const LAYOUT_RADIUS = 200;

function circularLayout(
  nodes: ClaimEvidenceGraphData['nodes']
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / Math.max(n, 1);
    positions.set(nodes[i].id, {
      x: LAYOUT_RADIUS + LAYOUT_RADIUS * Math.cos(angle),
      y: LAYOUT_RADIUS + LAYOUT_RADIUS * Math.sin(angle),
    });
  }
  return positions;
}

export interface GraphRendererProps {
  data: ClaimEvidenceGraphData;
  /** Map claimId → /claims/[id] */
  claimHref: (claimId: string) => string;
  /** Map evidenceId → source view (e.g. /documents/[docId]?chunkId=[chunkId]) */
  evidenceHref: (evidenceId: string, docId?: string | null, chunkId?: string | null) => string;
  /** Evidence doc/chunk lookup for navigation (optional) */
  evidenceMeta?: Map<
    string,
    { sourceDocumentId?: string | null; chunkId?: string | null }
  >;
}

export function GraphRenderer({
  data,
  claimHref,
  evidenceHref,
  evidenceMeta,
}: GraphRendererProps) {
  const positions = useMemo(() => circularLayout(data.nodes), [data.nodes]);

  const cx = LAYOUT_RADIUS * 2;
  const cy = LAYOUT_RADIUS * 2;
  const viewBox = `0 0 ${cx + NODE_R * 2} ${cy + NODE_R * 2}`;

  return (
    <Box
      component="svg"
      viewBox={viewBox}
      sx={{
        width: '100%',
        height: 480,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
      aria-label="Claim–evidence graph (read-only topology)"
    >
      {/* Edges: uniform styling */}
      <g aria-hidden>
        {data.edges.map((e, i) => {
          const sp = positions.get(e.source);
          const tp = positions.get(e.target);
          if (!sp || !tp) return null;
          return (
            <line
              key={`${e.source}-${e.target}-${i}`}
              x1={sp.x + NODE_R}
              y1={sp.y + NODE_R}
              x2={tp.x + NODE_R}
              y2={tp.y + NODE_R}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.6}
              data-testid="graph-edge"
            />
          );
        })}
      </g>

      {/* Nodes: uniform styling (no highlight/primary) */}
      {data.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;

        const x = pos.x + NODE_R;
        const y = pos.y + NODE_R;

        const href =
          node.type === 'claim'
            ? claimHref(node.id)
            : evidenceHref(
                node.id,
                evidenceMeta?.get(node.id)?.sourceDocumentId,
                evidenceMeta?.get(node.id)?.chunkId
              );

        const label = node.label.length > 20 ? `${node.label.slice(0, 17)}…` : node.label;

        return (
          <g key={node.id}>
            <Link
              href={href}
              style={{ textDecoration: 'none', color: 'inherit' }}
              aria-label={`${node.type}: ${label}`}
            >
              <circle
                cx={x}
                cy={y}
                r={NODE_R}
                fill="var(--mui-palette-background-default)"
                stroke="currentColor"
                strokeWidth={1.5}
                data-testid={node.type === 'claim' ? 'graph-claim-node' : 'graph-evidence-node'}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            </Link>
          </g>
        );
      })}
    </Box>
  );
}
