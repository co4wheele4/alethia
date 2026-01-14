'use client';

import { useParams } from 'next/navigation';

import { AppShell } from '../../components/shell';
import { useEntity } from '../../features/entities/hooks/useEntity';
import { EntityDetailView } from '../../features/entities/components/EntityDetailView';

export default function EntityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;
  const { entity, loading, error } = useEntity(id);

  return (
    <AppShell title="Entity">
      <EntityDetailView entity={entity} loading={loading} error={error} />
    </AppShell>
  );
}

