'use client';

import { AppShell } from '../components/layout';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Demo walkthrough" requireAuth={false}>
      {children}
    </AppShell>
  );
}
