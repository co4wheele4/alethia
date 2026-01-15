/**
 * Server Component Header
 * Can be rendered on the server for better performance
 * Uses Next.js 16 Server Components feature
 * Note: MUI components require 'use client', so this is a simple text component
 */

'use client';

export function ServerHeader() {
  // Rendered inside client components; keep it client-safe.
  return 'Aletheia';
}
