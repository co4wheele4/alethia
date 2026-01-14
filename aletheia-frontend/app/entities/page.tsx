'use client';

import { AppShell } from '../components/shell';
import { EntityList } from '../features/entities/components/EntityList';

export default function EntitiesPage() {
  return (
    <AppShell title="Entities">
      <EntityList />
    </AppShell>
  );
}

