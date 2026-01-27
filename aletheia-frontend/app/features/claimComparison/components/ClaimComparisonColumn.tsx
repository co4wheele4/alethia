'use client';

import { Box, Stack, Typography } from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { ImmutableRecordBadge } from '../../integrity/components/ImmutableRecordBadge';
import { ClaimStatusBadge } from '../../claims/components/ClaimStatusBadge';
import type { ClaimComparisonClaim } from '../hooks/useClaimsForComparison';
import { ClaimEvidenceList, type ClaimEvidenceListModel } from './ClaimEvidenceList';

function tokenize(text: string) {
  // Preserve whitespace tokens for readable diffs.
  return (text ?? '').split(/(\s+)/).filter((t) => t.length > 0);
}

type DiffPart = { value: string; added?: boolean; removed?: boolean };

function diffTokens(baseTokens: string[], nextTokens: string[]): DiffPart[] {
  const a = baseTokens;
  const b = nextTokens;
  const n = a.length;
  const m = b.length;

  // LCS DP; claim texts are short, and this remains deterministic.
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i]![j] = a[i] === b[j] ? (dp[i + 1]![j + 1] + 1) : Math.max(dp[i + 1]![j], dp[i]![j + 1]);
    }
  }

  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ value: a[i]! });
      i += 1;
      j += 1;
      continue;
    }
    if (dp[i + 1]![j] >= dp[i]![j + 1]) {
      out.push({ value: a[i]!, removed: true });
      i += 1;
    } else {
      out.push({ value: b[j]!, added: true });
      j += 1;
    }
  }
  while (i < n) out.push({ value: a[i++]!, removed: true });
  while (j < m) out.push({ value: b[j++]!, added: true });
  return out;
}

function DiffText(props: { base: string; next: string }) {
  const parts = diffTokens(tokenize(props.base), tokenize(props.next));
  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
      {parts.map((p, idx) => (
        <Box
          key={`${idx}:${p.value}`}
          component="span"
          sx={{
            bgcolor: (theme) => {
              if (p.added) return theme.palette.mode === 'dark' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(0, 200, 83, 0.12)';
              if (p.removed) return theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.14)' : 'rgba(244, 67, 54, 0.10)';
              return 'transparent';
            },
            textDecoration: p.removed ? 'line-through' : 'none',
            borderBottom: p.added ? '1px solid rgba(0, 200, 83, 0.55)' : 'none',
            opacity: p.removed ? 0.75 : 1,
          }}
        >
          {p.value}
        </Box>
      ))}
    </Typography>
  );
}

export function ClaimComparisonColumn(props: {
  label: string;
  claim: ClaimComparisonClaim;
  baseClaimText: string;
  evidence: ClaimEvidenceListModel;
}) {
  const { label, claim, baseClaimText, evidence } = props;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <ContentSurface>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            {label}
          </Typography>
          <ImmutableRecordBadge label="Read-only" />
          <ClaimStatusBadge status={claim.status} />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          claimId={claim.id} • created {new Date(claim.createdAt).toLocaleString()}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1.5 }}>
          Claim text
        </Typography>
        <DiffText base={baseClaimText} next={claim.text} />
      </ContentSurface>

      <ClaimEvidenceList model={evidence} />
    </Stack>
  );
}

