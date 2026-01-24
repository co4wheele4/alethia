/**
 * LadyJusticeProgressIndicator
 *
 * Seamless, infinite-loop progress indicator that animates ONLY the scales.
 * Animation contract is defined in `app/globals.css`:
 * - 0% and 100% keyframes are identical
 * - linear timing; easing comes from keyframe spacing
 * - prefers-reduced-motion disables animation
 */
 
'use client';

import { Box, type BoxProps } from '@mui/material';

export type LadyJusticeProgressIndicatorProps = {
  /**
   * Pixel size for the square icon.
   * Mirrors typical `CircularProgress size` usage.
   */
  size?: number;
  /**
   * Accessible label for screen readers.
   * Defaults to "Loading".
   */
  'aria-label'?: string;
} & Omit<BoxProps<'span'>, 'component' | 'children'>;

export function LadyJusticeProgressIndicator(props: LadyJusticeProgressIndicatorProps) {
  const { size = 18, sx, 'aria-label': ariaLabel = 'Loading', ...rest } = props;

  return (
    <Box
      component="span"
      role="progressbar"
      aria-label={ariaLabel}
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        flex: '0 0 auto',
        ...sx,
      }}
      {...rest}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" aria-hidden="true" focusable="false">
        {/* Static: hook + post */}
        <path
          d="M32 8c0-2.2 1.8-4 4-4 1.1 0 2 .9 2 2s-.9 2-2 2c-1.1 0-2 .9-2 2v2h-2V8z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M32 12v38"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M22 52h20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Rotating: beam + chains + pans (pivot near the hook) */}
        <g className="aletheia-lady-justice-scales-rotate">
          {/* Pivot anchor (keeps transform-origin stable across renderers) */}
          <circle cx="32" cy="10" r="0.01" fill="transparent" />

          {/* Beam */}
          <path d="M14 18h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 12v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

          {/* Left chain */}
          <path d="M18 18l-6 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 18l6 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left pan */}
          <path d="M8 34h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10 34c1.6 7.5 6.4 11 12 11s10.4-3.5 12-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

          {/* Right chain */}
          <path d="M46 18l-6 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M46 18l6 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right pan */}
          <path d="M36 34h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 34c1.6 7.5 6.4 11 12 11s10.4-3.5 12-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </Box>
  );
}

