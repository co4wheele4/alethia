import { AletheiaBundleService } from './aletheia-bundle.service';
import { ClaimStatus } from '@prisma/client';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';
import { evidenceContentSha256Hex } from '../common/utils/evidence-content-hash';

describe('AletheiaBundleService', () => {
  let service: AletheiaBundleService;
  let claimFindMany: jest.Mock;
  let claimFindFirst: jest.Mock;
  let evidenceFindMany: jest.Mock;
  let evidenceFindFirst: jest.Mock;
  let linkFindMany: jest.Mock;
  let adjFindMany: jest.Mock;
  let rrFindMany: jest.Mock;
  let raFindMany: jest.Mock;
  let respFindMany: jest.Mock;
  let ercFindMany: jest.Mock;
  let epFindMany: jest.Mock;
  let transaction: jest.Mock;

  beforeEach(() => {
    claimFindMany = jest.fn();
    claimFindFirst = jest.fn();
    evidenceFindMany = jest.fn();
    evidenceFindFirst = jest.fn();
    linkFindMany = jest.fn();
    adjFindMany = jest.fn();
    rrFindMany = jest.fn();
    raFindMany = jest.fn();
    respFindMany = jest.fn();
    ercFindMany = jest.fn();
    epFindMany = jest.fn();
    transaction = jest.fn();

    const prisma = {
      claim: { findMany: claimFindMany, findFirst: claimFindFirst },
      evidence: { findMany: evidenceFindMany, findFirst: evidenceFindFirst },
      claimEvidenceLink: { findMany: linkFindMany },
      adjudicationLog: { findMany: adjFindMany },
      reviewRequest: { findMany: rrFindMany },
      reviewAssignment: { findMany: raFindMany },
      reviewerResponse: { findMany: respFindMany },
      evidenceReproCheck: { findMany: ercFindMany },
      epistemicEvent: { findMany: epFindMany },
      $transaction: transaction,
    };
    service = new AletheiaBundleService(prisma as any);
  });

  it('exportBundle aggregates rows', async () => {
    claimFindMany.mockResolvedValue([
      { id: 'c1', text: 't', status: ClaimStatus.DRAFT },
    ]);
    linkFindMany.mockResolvedValue([{ evidenceId: 'e1', claimId: 'c1' }]);
    evidenceFindMany.mockResolvedValue([{ id: 'e1', snippet: 'x' }]);
    adjFindMany.mockResolvedValue([]);
    rrFindMany.mockResolvedValue([]);
    raFindMany.mockResolvedValue([]);
    respFindMany.mockResolvedValue([]);
    ercFindMany.mockResolvedValue([]);

    const b = await service.exportBundle({});
    expect(b.version).toBe('1');
    expect(b.claims).toHaveLength(1);
    expect(b.evidence).toHaveLength(1);
  });

  it('exportBundle applies structural filters', async () => {
    claimFindMany.mockResolvedValue([]);
    linkFindMany.mockResolvedValue([]);
    evidenceFindMany.mockResolvedValue([]);
    adjFindMany.mockResolvedValue([]);
    rrFindMany.mockResolvedValue([]);
    raFindMany.mockResolvedValue([]);
    respFindMany.mockResolvedValue([]);
    ercFindMany.mockResolvedValue([]);

    await service.exportBundle({
      claimIds: ['c1'],
      lifecycle: ClaimStatus.DRAFT,
      createdAfter: new Date(0),
      createdBefore: new Date(),
    });

    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['c1'] },
          status: ClaimStatus.DRAFT,
          createdAt: expect.any(Object),
        }),
      }),
    );
  });

  it('exportBundle can include epistemic events', async () => {
    claimFindMany.mockResolvedValue([]);
    linkFindMany.mockResolvedValue([]);
    evidenceFindMany.mockResolvedValue([]);
    adjFindMany.mockResolvedValue([]);
    rrFindMany.mockResolvedValue([]);
    raFindMany.mockResolvedValue([]);
    respFindMany.mockResolvedValue([]);
    ercFindMany.mockResolvedValue([]);
    epFindMany.mockResolvedValue([{ id: 'ep1' }]);

    const b = await service.exportBundle({
      includeEpistemicEvents: true,
      epistemicEventsAfter: new Date(0),
    });
    expect(b.epistemicEvents).toHaveLength(1);
  });

  it('exportBundle epistemic filter supports after-only and before-only', async () => {
    claimFindMany.mockResolvedValue([]);
    linkFindMany.mockResolvedValue([]);
    evidenceFindMany.mockResolvedValue([]);
    adjFindMany.mockResolvedValue([]);
    rrFindMany.mockResolvedValue([]);
    raFindMany.mockResolvedValue([]);
    respFindMany.mockResolvedValue([]);
    ercFindMany.mockResolvedValue([]);
    epFindMany.mockResolvedValue([]);

    await service.exportBundle({
      includeEpistemicEvents: true,
      epistemicEventsAfter: new Date(0),
    });
    await service.exportBundle({
      includeEpistemicEvents: true,
      epistemicEventsBefore: new Date(),
    });
    expect(epFindMany).toHaveBeenCalled();
  });

  it('importBundle rejects evidence collision without claim collision', async () => {
    claimFindFirst.mockResolvedValue(null);
    evidenceFindFirst.mockResolvedValue({ id: 'e1' });
    const snippet = 'hello';
    const h = evidenceContentSha256Hex(snippet);
    await expect(
      service.importBundle(
        {
          version: '1',
          exportedAt: '',
          claims: [],
          evidence: [{ id: 'e1', snippet, contentSha256: h }],
          claimEvidenceLinks: [],
          adjudicationLogs: [],
          reviewRequests: [],
          reviewAssignments: [],
          reviewerResponses: [],
          evidenceReproChecks: [],
          epistemicEvents: [],
        },
        false,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.IMPORT_COLLISION },
    });
  });

  it('importBundle rejects invalid version', async () => {
    await expect(
      service.importBundle(
        {
          version: '0',
          exportedAt: '',
          claims: [],
          evidence: [],
          claimEvidenceLinks: [],
          adjudicationLogs: [],
          reviewRequests: [],
          reviewAssignments: [],
          reviewerResponses: [],
          evidenceReproChecks: [],
          epistemicEvents: [],
        },
        false,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED },
    });
  });

  it('importBundle rejects hash mismatch', async () => {
    const h = evidenceContentSha256Hex('wrong');
    await expect(
      service.importBundle(
        {
          version: '1',
          exportedAt: '',
          claims: [],
          evidence: [
            {
              id: 'e1',
              snippet: 'hello',
              contentSha256: h,
            },
          ],
          claimEvidenceLinks: [],
          adjudicationLogs: [],
          reviewRequests: [],
          reviewAssignments: [],
          reviewerResponses: [],
          evidenceReproChecks: [],
          epistemicEvents: [],
        },
        false,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED },
    });
  });

  it('importBundle rejects collision', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    const snippet = 'hello';
    const h = evidenceContentSha256Hex(snippet);
    await expect(
      service.importBundle(
        {
          version: '1',
          exportedAt: '',
          claims: [{ id: 'c1' }],
          evidence: [{ id: 'e1', snippet, contentSha256: h }],
          claimEvidenceLinks: [],
          adjudicationLogs: [],
          reviewRequests: [],
          reviewAssignments: [],
          reviewerResponses: [],
          evidenceReproChecks: [],
          epistemicEvents: [],
        },
        false,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.IMPORT_COLLISION },
    });
  });

  it('importBundle commits empty structural bundle', async () => {
    claimFindFirst.mockResolvedValue(null);
    evidenceFindFirst.mockResolvedValue(null);
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        claim: { createMany: jest.fn(), deleteMany: jest.fn() },
        evidence: { createMany: jest.fn(), deleteMany: jest.fn() },
        claimEvidenceLink: { createMany: jest.fn(), deleteMany: jest.fn() },
        adjudicationLog: { createMany: jest.fn(), deleteMany: jest.fn() },
        reviewRequest: { createMany: jest.fn(), deleteMany: jest.fn() },
        reviewAssignment: { createMany: jest.fn(), deleteMany: jest.fn() },
        reviewerResponse: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
        evidenceReproCheck: { deleteMany: jest.fn(), createMany: jest.fn() },
        epistemicEvent: { createMany: jest.fn() },
      } as any),
    );

    const r = await service.importBundle(
      {
        version: '1',
        exportedAt: '',
        claims: [],
        evidence: [],
        claimEvidenceLinks: [],
        adjudicationLogs: [],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      false,
    );
    expect(r.importedClaims).toBe(0);
    expect(r.importedEvidence).toBe(0);
  });

  it('importBundle overwrites when allowed', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    evidenceFindFirst.mockResolvedValue({ id: 'e1' });
    const snippet = 'hello';
    const h = evidenceContentSha256Hex(snippet);
    const del = jest.fn();
    const createMany = jest.fn();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        reviewerResponse: { deleteMany: del, createMany },
        reviewAssignment: { deleteMany: del, createMany },
        reviewRequest: { deleteMany: del, createMany },
        adjudicationLog: { deleteMany: del, createMany },
        claimEvidenceLink: { deleteMany: del, createMany },
        evidenceReproCheck: { deleteMany: del, createMany },
        claim: { deleteMany: del, createMany },
        evidence: { deleteMany: del, createMany },
        epistemicEvent: { createMany },
      } as any),
    );

    await service.importBundle(
      {
        version: '1',
        exportedAt: '',
        claims: [{ id: 'c1' }],
        evidence: [{ id: 'e1', snippet, contentSha256: h }],
        claimEvidenceLinks: [],
        adjudicationLogs: [],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      true,
    );
    expect(del).toHaveBeenCalled();
  });

  it('importBundle overwrite deletes when only evidence collides', async () => {
    claimFindFirst.mockResolvedValue(null);
    evidenceFindFirst.mockResolvedValue({ id: 'e1' });
    const snippet = 'hello';
    const h = evidenceContentSha256Hex(snippet);
    const del = jest.fn();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        reviewerResponse: { deleteMany: del, createMany: jest.fn() },
        reviewAssignment: { deleteMany: del, createMany: jest.fn() },
        reviewRequest: { deleteMany: del, createMany: jest.fn() },
        adjudicationLog: { deleteMany: del, createMany: jest.fn() },
        claimEvidenceLink: { deleteMany: del, createMany: jest.fn() },
        evidenceReproCheck: { deleteMany: del, createMany: jest.fn() },
        claim: { deleteMany: del, createMany: jest.fn() },
        evidence: { deleteMany: del, createMany: jest.fn() },
        epistemicEvent: { createMany: jest.fn() },
      } as any),
    );

    await service.importBundle(
      {
        version: '1',
        exportedAt: '',
        claims: [],
        evidence: [{ id: 'e1', snippet, contentSha256: h }],
        claimEvidenceLinks: [],
        adjudicationLogs: [],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      true,
    );
    expect(del).toHaveBeenCalled();
  });

  it('importBundle writes non-empty rows', async () => {
    claimFindFirst.mockResolvedValue(null);
    evidenceFindFirst.mockResolvedValue(null);
    const snippet = 'hello';
    const h = evidenceContentSha256Hex(snippet);
    const cm = jest.fn();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        claim: { createMany: cm, deleteMany: jest.fn() },
        evidence: { createMany: cm, deleteMany: jest.fn() },
        claimEvidenceLink: { createMany: cm, deleteMany: jest.fn() },
        adjudicationLog: { createMany: cm, deleteMany: jest.fn() },
        reviewRequest: { createMany: cm, deleteMany: jest.fn() },
        reviewAssignment: { createMany: cm, deleteMany: jest.fn() },
        reviewerResponse: { createMany: cm, deleteMany: jest.fn() },
        evidenceReproCheck: { createMany: cm, deleteMany: jest.fn() },
        epistemicEvent: { createMany: cm },
      } as any),
    );

    await service.importBundle(
      {
        version: '1',
        exportedAt: '',
        claims: [{ id: 'c1' }],
        evidence: [{ id: 'e1', snippet, contentSha256: h }],
        claimEvidenceLinks: [{ evidenceId: 'e1', claimId: 'c1' }],
        adjudicationLogs: [{ id: 'a1' }],
        reviewRequests: [{ id: 'r1' }],
        reviewAssignments: [{ id: 'as1' }],
        reviewerResponses: [{ id: 'resp1' }],
        evidenceReproChecks: [{ id: 'erc1' }],
        epistemicEvents: [{ id: 'ep1' }],
      },
      false,
    );
    expect(cm.mock.calls.length).toBeGreaterThan(5);
  });
});
