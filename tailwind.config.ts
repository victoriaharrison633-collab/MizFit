import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Fresh Sage design tokens.
 *
 * Every hex below is copied from SPEC.md § 11 and from nowhere else. The
 * superseded "Warm Earth" palette (coral / amber / cream) must not appear
 * anywhere in this codebase.
 *
 * TWO GREENS, AND WHY — SPEC.md § 11 states these ratios as verified fact; they
 * are not re-derived here:
 *
 *   cta       #5B8C3E   3.99:1 on white — clears the 3:1 bar for large/bold
 *                       text, icons and UI borders. FAILS the 4.5:1 minimum for
 *                       normal-size text.
 *   cta-dark  #4D7735   5.24:1 on white — the fill for any solid button whose
 *                       label is normal-size text.
 *   muted     #6B8A6D   3.83:1 on white — same restriction as cta.
 *
 * The restriction is enforced by the components, not just by this comment:
 * `cta` and `muted` appear only as borders, focus outlines and icons, and the
 * only white-on-green surface in src/components/ui is the solid Button, which
 * fills with `cta-dark`.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAF5',
        cta: '#5B8C3E',
        'cta-dark': '#4D7735',
        tint: '#EDF5E4',
        text: '#2C3E2D',
        muted: '#6B8A6D',
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [animate],
}

export default config
