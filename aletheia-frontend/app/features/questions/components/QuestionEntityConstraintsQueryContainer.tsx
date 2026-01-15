/**
 * QuestionEntityConstraintsQueryContainer
 *
 * Exists to strictly map one UI container to one GraphQL query:
 * - Query: `ENTITIES_QUERY`
 *
 * Used by the Question Workspace to list selectable entity constraints.
 */
'use client';

import type { EntityListItem } from '../../entities/hooks/useEntities';
import { useEntities } from '../../entities/hooks/useEntities';

export function QuestionEntityConstraintsQueryContainer(props: {
  children: (state: { entities: EntityListItem[]; loading: boolean; error: Error | null }) => React.ReactNode;
}) {
  const { children } = props;
  const q = useEntities();
  return children({ entities: q.entities, loading: q.loading, error: q.error });
}

