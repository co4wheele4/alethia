/**
 * OptimisticButton Component
 * Uses React 19 useOptimistic for optimistic UI updates
 */

'use client';

import { useOptimistic, useTransition } from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface OptimisticButtonProps extends ButtonProps {
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
    // Set optimistic state immediately
    setOptimisticState(true);
    
    startTransition(async () => {
      try {
        await action();
      } finally {
        // Reset optimistic state after action completes
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
