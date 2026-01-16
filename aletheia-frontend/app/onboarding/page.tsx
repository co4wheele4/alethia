'use client';

import { AppShell } from '../components/shell';
import { ContentSurface } from '../components/layout';
import { OnboardingWizard } from '../features/onboarding';

export default function OnboardingPage() {
  return (
    <AppShell title="Onboarding">
      <ContentSurface>
        <OnboardingWizard />
      </ContentSurface>
    </AppShell>
  );
}

