'use client';

import { AppShell } from '../components/shell';
import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { AnalysisWorkspace } from '../features/analysis/components/AnalysisWorkspace';

export default function AnalysisPage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  return (
    <AppShell title="Analysis">
      <AnalysisWorkspace userId={userId} />
    </AppShell>
  );
}

