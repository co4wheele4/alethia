/**
 * Server Component Header
 * Can be rendered on the server for better performance
 * Uses Next.js 16 Server Components feature
 * Note: MUI components require 'use client', so this is a simple text component
 */

export function ServerHeader() {
  // This is a Server Component - no 'use client' directive
  // Can access server-side data directly
  // Returns plain text/HTML since MUI requires client components
  return 'Aletheia';
}
