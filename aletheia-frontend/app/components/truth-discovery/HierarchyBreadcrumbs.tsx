/**
 * HierarchyBreadcrumbs Component
 * Breadcrumb always visible to show position in truth hierarchy
 */

'use client';

import { Breadcrumbs, Link } from '@mui/material';

export interface HierarchyBreadcrumbsProps {
  // TODO: Define props
  path?: Array<{ label: string; id: string }>;
  onNavigate?: (id: string) => void;
}

export function HierarchyBreadcrumbs(props: HierarchyBreadcrumbsProps) {
  const { path = [] } = props;

  return (
    <Breadcrumbs>
      {/* TODO: Implement breadcrumb navigation */}
      {path.length === 0 && <span>HierarchyBreadcrumbs - TODO: Implement</span>}
      {path.map((item) => (
        <Link
          key={item.id}
          onClick={() => props.onNavigate?.(item.id)}
          sx={{ cursor: 'pointer' }}
        >
          {item.label}
        </Link>
      ))}
    </Breadcrumbs>
  );
}
