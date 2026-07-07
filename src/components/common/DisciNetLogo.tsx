/**
 * DisciNetLogo — Official DisciNet brand mark.
 *
 * Variants:
 *  "primary" → full primary logo (Image 1): icon + "DisciNet" + tagline + subtitle
 *              Use for splash screen, marketing pages, auth covers.
 *  "full"    → compact sidebar logo: icon + "Disci|Net" JSX wordmark (no tagline)
 *  "icon"    → standalone icon mark only (sidebar collapsed, favicon context)
 *  "wordmark"→ alias for "full"
 *
 * theme prop:
 *  "dark"    → white "Disci" text (for navy/dark surfaces)
 *  "light"   → navy  "Disci" text (for white/light surfaces, default)
 */

// Official primary logo — full horizontal with wordmark + tagline (Image 1)
const PRIMARY_LOGO_URL =
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260707/image_1783400437208.png';

// Official icon mark — globe + mosque arch + open book + gold star (official_logo.png)
const ICON_MARK_URL =
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260707/official_logo.png';

interface DisciNetLogoProps {
  /** Height in px — width auto-scales. For "primary" variant, controls image height. */
  size?: number;
  className?: string;
  /** See variant docs above */
  variant?: 'primary' | 'full' | 'icon' | 'wordmark';
  /**
   * "dark"  → white wordmark for dark/navy backgrounds
   * "light" → navy  wordmark for light backgrounds (default)
   */
  theme?: 'dark' | 'light';
}

export function DisciNetLogo({
  size = 36,
  className = '',
  variant = 'full',
  theme = 'light',
}: DisciNetLogoProps) {
  // ── Primary — full branding image (includes tagline) ─────────────────────
  if (variant === 'primary') {
    return (
      <img
        src={PRIMARY_LOGO_URL}
        alt="DisciNet — Knowledge. Faith. Innovation."
        height={size}
        style={{ height: size, width: 'auto', maxWidth: '100%' }}
        className={`object-contain shrink-0 ${className}`}
        draggable={false}
      />
    );
  }

  // ── Icon only ────────────────────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <img
        src={ICON_MARK_URL}
        alt="DisciNet"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`object-contain shrink-0 ${className}`}
        draggable={false}
      />
    );
  }

  // ── Full / Wordmark — icon + compact "Disci|Net" JSX wordmark ────────────
  const navyColor  = theme === 'dark' ? '#FFFFFF' : '#001B2A';
  const fontSize   = Math.round(size * 0.72);

  return (
    <span className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <img
        src={ICON_MARK_URL}
        alt="DisciNet icon"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain shrink-0"
        draggable={false}
      />
      <span
        aria-label="DisciNet"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          userSelect: 'none',
        }}
      >
        <span style={{ color: navyColor }}>Disci</span>
        <span style={{ color: '#0EA5A0' }}>Net</span>
      </span>
    </span>
  );
}
