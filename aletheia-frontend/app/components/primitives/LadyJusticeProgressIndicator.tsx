/**
 * Aletheia progress indicator (Lady Justice line-draw)
 *
 * Progress indicator that starts blank and draws in linework.
 * Uses the provided Lady Justice line art raster as an alpha mask (no canvas/RAF).
 * Animation contract is defined in `app/globals.css`:
 * - 0% and 100% keyframes are identical
 * - linear timing; easing comes from keyframe spacing
 * - prefers-reduced-motion disables animation
 */
 
'use client';

import { Box, type BoxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
  const scaledSize = size * 1.5;
  const theme = useTheme();
  const inkColor = theme.palette.text.primary;
  const shadow =
    theme.palette.mode === 'dark'
      ? 'drop-shadow(0 0 1px rgba(0,0,0,0.75))'
      : 'drop-shadow(0 0 1px rgba(255,255,255,0.55))';

  return (
    <Box
      component="span"
      role="progressbar"
      aria-label={ariaLabel}
      sx={{
        width: scaledSize,
        height: scaledSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Theme-aware "ink": light mode -> dark, dark mode -> light.
        // Callers can still override via `sx`.
        color: inkColor,
        flex: '0 0 auto',
        ...sx,
      }}
      {...rest}
    >
      <Box
        aria-hidden="true"
        className="aletheia-lady-justice-line-draw"
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox="0 0 600 900"
          width="100%"
          height="100%"
          aria-hidden="true"
          focusable="false"
          style={{ filter: shadow }}
        >
          <defs>
            {/* Invert RGB so black lines become white (mask-visible) and white background becomes black (mask-hidden). */}
            <filter id="aletheiaInvertRgb" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
              />
            </filter>

            <mask id="aletheiaLadyJusticeMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
              {/* Black background (transparent mask) */}
              <rect x="0" y="0" width="600" height="900" fill="black" />
              {/* White where lines exist (after invert). */}
              <image
                href="/images/lady-justice-lineart.png"
                x="0"
                y="0"
                width="600"
                height="900"
                preserveAspectRatio="xMidYMid meet"
                filter="url(#aletheiaInvertRgb)"
              />
            </mask>
          </defs>

          {/* Draw the masked linework in currentColor */}
          <rect
            x="0"
            y="0"
            width="600"
            height="900"
            fill="currentColor"
            mask="url(#aletheiaLadyJusticeMask)"
          />
        </svg>
      </Box>
    </Box>
  );
}

