/**
 * OptimisticButton Component
 * Uses React 19 useOptimistic for optimistic UI updates
 */

'use client';

import { useOptimistic, useTransition } from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface OptimisticButtonProps extends Omit<ButtonProps, 'action'> {
  action: () => Promise<void>;
  optimisticLabel?: string;
  children: React.ReactNode;
}

export function OptimisticButton({
  action,
  optimisticLabel,
  children,
  ...buttonProps
}: OptimisticButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    false,
    (currentState: boolean, optimisticValue: boolean) => optimisticValue
  );

  const handleClick = () => {
    // React requires optimistic updates to occur within an action/transition.
    startTransition(async () => {
      setOptimisticState(true);
      try {
        await action();
      } catch (e) {
        // Swallow to avoid unhandled rejections; error handling is caller-specific.
        // Consumers can still observe failures via their own state or logging.
        console.error(e);
      } finally {
        setOptimisticState(false);
      }
    });
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={isPending || optimisticState || buttonProps.disabled}
    >
      {optimisticState && optimisticLabel ? optimisticLabel : children}
    </Button>
  );
}
