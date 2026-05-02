import { buildHeaderBreadcrumbs, isLinkableHref } from '../header-breadcrumbs';

describe('buildHeaderBreadcrumbs', () => {
  it('includes Home only on root path', () => {
    expect(buildHeaderBreadcrumbs('/', 'Sign in')).toEqual([{ label: 'Home', href: '/' }]);
  });

  it('links known section roots', () => {
    const crumbs = buildHeaderBreadcrumbs('/documents', 'Documents');
    expect(crumbs).toEqual([{ label: 'Home', href: '/' }]);
    expect(isLinkableHref('/documents')).toBe(true);
  });

  it('links crawl list before dynamic run id', () => {
    const crumbs = buildHeaderBreadcrumbs(
      '/ingestion/html-crawl-runs/2c0017f8-9ec8-468c-9055-37cf42dd3cbd',
      'Run detail',
    );
    expect(crumbs[0]).toEqual({ label: 'Home', href: '/' });
    expect(crumbs[1]).toEqual({ label: 'Ingestion' }); // no /ingestion route
    expect(crumbs[2]).toEqual({ label: 'HTML crawl runs', href: '/ingestion/html-crawl-runs' });
    expect(crumbs[3]).toEqual({ label: 'Details' });
  });
});
