import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  EvidenceReproFetchStatus,
  EvidenceReproHashMatch,
  EvidenceSourceKind,
} from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

/**
 * ADR-026: Mechanical reproducibility checks (fetch + hash compare only).
 */
@Injectable()
export class EvidenceReproCheckService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs one check for URL evidence; inserts an EvidenceReproCheck row. Does not mutate evidence.
   */
  async runCheckForEvidenceId(evidenceId: string) {
    const ev = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });
    if (!ev) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    const urlBacked = ev.sourceType === EvidenceSourceKind.URL && ev.sourceUrl;

    if (!urlBacked) {
      return this.prisma.evidenceReproCheck.create({
        data: {
          evidenceId,
          fetchStatus: EvidenceReproFetchStatus.FAILED,
          hashMatch: EvidenceReproHashMatch.UNKNOWN,
          errorMessage:
            'Reproducibility check applies only to URL evidence with sourceUrl',
        },
      });
    }

    try {
      const sourceUrl = ev.sourceUrl as string;
      const res = await fetch(sourceUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'AletheiaEvidenceReproCheck/1.0' },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const fetchedHex = createHash('sha256').update(buf).digest('hex');
      const stored = ev.contentSha256;
      let hashMatch: EvidenceReproHashMatch;
      if (!stored) {
        hashMatch = EvidenceReproHashMatch.UNKNOWN;
      } else {
        hashMatch =
          stored === fetchedHex
            ? EvidenceReproHashMatch.MATCH
            : EvidenceReproHashMatch.MISMATCH;
      }
      return this.prisma.evidenceReproCheck.create({
        data: {
          evidenceId,
          fetchStatus: res.ok
            ? EvidenceReproFetchStatus.SUCCESS
            : EvidenceReproFetchStatus.FAILED,
          hashMatch,
          fetchedHash: fetchedHex,
          errorMessage: res.ok ? null : `HTTP ${res.status}`,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return this.prisma.evidenceReproCheck.create({
        data: {
          evidenceId,
          fetchStatus: EvidenceReproFetchStatus.FAILED,
          hashMatch: EvidenceReproHashMatch.UNKNOWN,
          errorMessage: msg,
        },
      });
    }
  }

  /**
   * Batch: URL evidence only; optional `olderThanHours` skips rows checked recently.
   */
  async runBatch(args: {
    evidenceId?: string;
    olderThanHours?: number;
  }): Promise<{ processed: number }> {
    if (args.evidenceId) {
      await this.runCheckForEvidenceId(args.evidenceId);
      return { processed: 1 };
    }

    const olderThan = args.olderThanHours;
    const cutoff =
      typeof olderThan === 'number' && olderThan > 0
        ? new Date(Date.now() - olderThan * 3600 * 1000)
        : undefined;

    const candidates = await this.prisma.evidence.findMany({
      where: {
        sourceType: EvidenceSourceKind.URL,
        sourceUrl: { not: null },
      },
      select: { id: true },
    });

    let processed = 0;
    for (const { id } of candidates) {
      if (cutoff) {
        const last = await this.prisma.evidenceReproCheck.findFirst({
          where: { evidenceId: id },
          orderBy: { checkedAt: 'desc' },
          select: { checkedAt: true },
        });
        if (last && last.checkedAt > cutoff) continue;
      }
      await this.runCheckForEvidenceId(id);
      processed += 1;
    }

    return { processed };
  }
}
