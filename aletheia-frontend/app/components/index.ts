/**
 * Aletheia Components Registry
 * Main index file that exports shared components
 */

// Common shared components
export * from './common/ErrorBoundary';

// Layout components
export * from './layout';

// Primitive UI components
export * from './primitives/OptimisticButton';
export * from './primitives/LadyJusticeProgressIndicator';
export * from './primitives/SkeletonLoader';
export * from './primitives/ThemeToggle';

// Export from features for backward compatibility or central access if needed
export * from '../features/entities/components';
export * from '../features/clarity/components';
export * from '../features/integrity/components';
export * from '../features/user-agency/components';
export * from '../features/search/components';
export * from '../features/ethical/components';
export * from '../features/dev/components';
export * from '../features/supergraph/components';
export { LoginForm } from '../features/auth/components/LoginForm';
