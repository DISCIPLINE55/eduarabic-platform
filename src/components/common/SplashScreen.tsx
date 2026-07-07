/**
 * SplashScreen — matches Image 5 exactly:
 *  - Deep space / dark navy background with radial gradient
 *  - SVG constellation network (dots + connecting lines)
 *  - Earth atmosphere glow at the bottom
 *  - Official PRIMARY logo (Image 1) centred — full branding with tagline
 *  - "Loading wisdom..." text + thin teal ring spinner
 */

// Full primary logo — includes wordmark + "KNOWLEDGE. FAITH. INNOVATION." tagline
const PRIMARY_LOGO_URL =
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260707/image_1783400437208.png';
// Icon mark only — for the large centred icon on the first splash variant (left phone in Image 5)
const ICON_MARK_URL =
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260707/official_logo.png';

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1e35 0%, #07111f 55%, #030a14 100%)' }}
    >
      {/* ── Constellation SVG background ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="earthGlow" cx="50%" cy="100%" r="55%">
            <stop offset="0%"   stopColor="#1a6b8a" stopOpacity="0.55" />
            <stop offset="40%"  stopColor="#0d3d55" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#030a14"  stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Constellation connecting lines */}
        {CONSTELLATION_LINES.map((l, i) => (
          <line
            key={i}
            x1={`${l.x1}%`} y1={`${l.y1}%`}
            x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.7"
          />
        ))}

        {/* Star dots */}
        {STAR_NODES.map((s, i) => (
          <circle
            key={i}
            cx={`${s.cx}%`}
            cy={`${s.cy}%`}
            r={s.r}
            fill="white"
            opacity={s.op}
          />
        ))}

        {/* Earth atmosphere glow at bottom */}
        <ellipse cx="50%" cy="102%" rx="65%" ry="35%" fill="url(#earthGlow)" />
        {/* Horizon arc */}
        <ellipse cx="50%" cy="100%" rx="60%" ry="8%" fill="none"
          stroke="rgba(30,130,180,0.18)" strokeWidth="1" />
        <ellipse cx="50%" cy="100%" rx="58%" ry="6%" fill="none"
          stroke="rgba(30,180,200,0.1)" strokeWidth="0.6" />
      </svg>

      {/* ── Centre content ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center">
        {/* Official icon mark — large centred (left phone variant in Image 5) */}
        <img
          src={ICON_MARK_URL}
          alt="DisciNet"
          width={120}
          height={120}
          className="object-contain drop-shadow-[0_0_24px_rgba(14,165,160,0.35)]"
          draggable={false}
        />

        {/* Full primary logo — wordmark + tagline (right phone variant in Image 5) */}
        <img
          src={PRIMARY_LOGO_URL}
          alt="DisciNet — Knowledge. Faith. Innovation."
          style={{ height: 48, width: 'auto', maxWidth: 280 }}
          className="object-contain"
          draggable={false}
        />

        {/* Loading row */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 14,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Loading wisdom...
          </p>
          {/* Thin ring spinner — matches Image 5 exactly */}
          <div
            className="animate-spin"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(14,165,160,0.8)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Constellation data (% coordinates, viewport-relative) ─────────────────────
const STAR_NODES = [
  { cx:  8, cy: 12, r: 1.5, op: 0.7 },
  { cx: 18, cy:  7, r: 1.2, op: 0.5 },
  { cx: 30, cy: 15, r: 1.0, op: 0.6 },
  { cx: 22, cy: 28, r: 1.3, op: 0.4 },
  { cx: 70, cy:  8, r: 1.5, op: 0.7 },
  { cx: 82, cy: 18, r: 1.2, op: 0.5 },
  { cx: 75, cy: 30, r: 1.4, op: 0.55},
  { cx: 90, cy: 10, r: 1.0, op: 0.45},
  { cx: 92, cy: 35, r: 1.2, op: 0.4 },
  { cx: 55, cy:  5, r: 1.0, op: 0.5 },
  { cx: 45, cy: 20, r: 1.3, op: 0.35},
  { cx:  5, cy: 40, r: 1.0, op: 0.3 },
  { cx: 15, cy: 55, r: 1.2, op: 0.3 },
  { cx: 88, cy: 55, r: 1.0, op: 0.3 },
  { cx: 95, cy: 65, r: 1.3, op: 0.25},
  { cx: 35, cy: 10, r: 1.0, op: 0.4 },
  { cx: 60, cy: 18, r: 1.1, op: 0.4 },
  { cx: 65, cy:  3, r: 1.4, op: 0.55},
  { cx: 10, cy: 25, r: 1.0, op: 0.4 },
  { cx: 78, cy: 42, r: 1.0, op: 0.3 },
];

const CONSTELLATION_LINES = [
  { x1:  8, y1: 12, x2: 18, y2:  7 },
  { x1: 18, y1:  7, x2: 30, y2: 15 },
  { x1: 30, y1: 15, x2: 22, y2: 28 },
  { x1:  8, y1: 12, x2: 22, y2: 28 },
  { x1: 70, y1:  8, x2: 82, y2: 18 },
  { x1: 82, y1: 18, x2: 75, y2: 30 },
  { x1: 70, y1:  8, x2: 90, y2: 10 },
  { x1: 90, y1: 10, x2: 92, y2: 35 },
  { x1: 82, y1: 18, x2: 92, y2: 35 },
  { x1: 55, y1:  5, x2: 65, y2:  3 },
  { x1: 65, y1:  3, x2: 70, y2:  8 },
  { x1: 35, y1: 10, x2: 45, y2: 20 },
  { x1: 45, y1: 20, x2: 60, y2: 18 },
  { x1: 18, y1:  7, x2: 35, y2: 10 },
  { x1: 88, y1: 55, x2: 95, y2: 65 },
  { x1: 78, y1: 42, x2: 88, y2: 55 },
];

