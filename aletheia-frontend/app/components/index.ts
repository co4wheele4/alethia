/**
 * Aletheia Components Registry
 * Main index file that exports all components organized by category
 * 
 * Usage:
 *   import { KnowledgeTreeView, WhyPanel } from '@/components';
 *   import { TruthDiscovery } from '@/components/truth-discovery';
 */

// Truth Discovery
export * from './truth-discovery';

// Clarity & Sense-Making
export * from './clarity';

// Integrity & Trust
export * from './integrity';

// User Agency
export * from './user-agency';

// Layout
export * from './layout';

// Search & Discovery
export * from './search';

// Ethical UX
export * from './ethical';

// Developer-Facing Truth
export * from './dev';

// Supergraph & AI-Ready
export * from './supergraph';

// AI Components
export * from './ai';

// Legacy UI components (existing)
export { LoginForm } from './ui/LoginForm';
export { ThemeToggle } from './ui/ThemeToggle';
export { GraphQLExample } from './ui/GraphQLExample';
