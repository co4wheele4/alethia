/**
 * Path-based breadcrumbs for AppShell header (mechanical labels only).
 */

/** Exact paths that exist as real routes (intermediate crumbs get `href`). */
const LINKABLE_EXACT = new Set<string>([
  '/',
  '/dashboard',
  '/documents',
  '/entities',
  '/evidence',
  '/claims',
  '/claims/graph',
  '/claims/compare',
  '/search',
  '/review-queue',
  '/relationships',
  '/questions',
  '/provenance',
  '/onboarding',
  '/analysis',
  '/demo',
  '/admin/epistemic-events',
  '/ingestion/html-crawl-runs',
]);

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  documents: 'Documents',
  entities: 'Entities',
  evidence: 'Evidence',
  claims: 'Claims',
  graph: 'Claim graph',
  compare: 'Compare',
  search: 'Search',
  'review-queue': 'Review queue',
  relationships: 'Relationships',
  questions: 'Questions',
  provenance: 'Provenance',
  onboarding: 'Onboarding',
  analysis: 'Analysis',
  demo: 'Demo',
  admin: 'Admin',
  'epistemic-events': 'Epistemic events',
  ingestion: 'Ingestion',
  'html-crawl-runs': 'HTML crawl runs',
};

function humanizeSegment(seg: string): string {
  return seg
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function segmentLabel(segment: string): string {
  const lower = segment.toLowerCase();
  if (SEGMENT_LABELS[lower]) return SEGMENT_LABELS[lower];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return 'Details';
  }
  return humanizeSegment(segment);
}

export function isLinkableHref(href: string): boolean {
  return LINKABLE_EXACT.has(href);
}

export type HeaderBreadcrumb = { label: string; href?: string };

/**
 * @param pathname — `usePathname()` (includes basePath if configured)
 * @param pageTitle — header title; used to avoid duplicating the same label as the final breadcrumb leaf
 */
export function buildHeaderBreadcrumbs(pathname: string, pageTitle: string): HeaderBreadcrumb[] {
  const normalized = pathname && pathname.length > 0 ? pathname : '/';
  const parts = normalized.split('/').filter(Boolean);

  const out: HeaderBreadcrumb[] = [{ label: 'Home', href: '/' }];

  if (parts.length === 0) {
    return out;
  }

  for (let i = 0; i < parts.length - 1; i += 1) {
    const href = `/${parts.slice(0, i + 1).join('/')}`;
    const label = segmentLabel(parts[i]);
    if (isLinkableHref(href)) {
      out.push({ label, href });
    } else {
      out.push({ label });
    }
  }

  const lastSeg = parts[parts.length - 1]!;
  const lastLabel = segmentLabel(lastSeg);
  const titleNorm = pageTitle.trim().toLowerCase();
  const labelNorm = lastLabel.trim().toLowerCase();

  // Current page is always shown in the header title; only add a leaf crumb when it adds navigation context
  // (e.g. UUID detail) and does not merely repeat the title (e.g. /documents + "Documents").
  if (labelNorm !== titleNorm) {
    out.push({ label: lastLabel });
  }

  return out;
}
