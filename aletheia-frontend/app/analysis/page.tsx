'use client';

import { AppShell } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
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

