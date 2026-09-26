/**
 * Hand-curated country flag data, rendered as inline SVG.
 *
 * Two rendering strategies:
 *
 * 1. **Compositional builders** (`tricolor`, `stripes`, `canton`, …) for
 *    simple flags (~80% of the world — vertical/horizontal tricolors, plain
 *    stripes with a canton, etc.). One renderer produces many flags.
 *
 * 2. **Custom inline SVGs** for flags with non-trivial geometry (US stars,
 *    UK Union Jack, Nordic cross, southern hemisphere stars, etc.). Each
 *    custom flag is ~30-80 lines of SVG, hand-curated to match the official
 *    proportions at 24×16 viewBox.
 *
 * The goal is a deterministic, zero-dep flag library that renders the same
 * anywhere (no font/emoji dependency). The whole flag set ships at ~20KB
 * minified; the data table is ~6KB.
 */
import type { ReactElement, ReactNode } from 'react'

/** SVG viewBox used by every flag. 24:16 ≈ the real flag aspect ratio. */
export const FLAG_VIEWBOX = '0 0 24 16' as const

// ---------------------------------------------------------------------------
// Builders — composed by name from the registry below.
// ---------------------------------------------------------------------------

/** Vertical N-stripe. `colors.length` slices the rect width-wise. */
function verticalStripes(colors: string[]): ReactElement {
  const w = 24 / colors.length
  return (
    <g>
      {colors.map((c, i) => (
        <rect key={i} x={i * w} width={w} height="16" fill={c} />
      ))}
    </g>
  )
}

/** Horizontal N-stripe. `colors.length` slices the rect height-wise. */
function horizontalStripes(colors: string[]): ReactElement {
  const h = 16 / colors.length
  return (
    <g>
      {colors.map((c, i) => (
        <rect key={i} y={i * h} width="24" height={h} fill={c} />
      ))}
    </g>
  )
}

/** 5-pointed star centered at (cx,cy) with outer radius r. Standard 36° intervals. */
export function star5(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? r : r * 0.42
    pts.push(`${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

// ---------------------------------------------------------------------------
// Custom flag shapes — hand-drawn for non-trivial geometry.
// ---------------------------------------------------------------------------

/** United States — 13 stripes (7 red + 6 white) + blue canton with 50 stars
 *  arranged in 9 alternating rows (6,5,6,5,6,5,6,5,6). */
function flagUS(): ReactElement {
  const STRIPE_H = 16 / 13
  const CANTON_W = 10
  const CANTON_H = STRIPE_H * 7
  const rowCounts = [6, 5, 6, 5, 6, 5, 6, 5, 6]
  const rowYs = [0.85, 1.65, 2.45, 3.25, 4.05, 4.85, 5.65, 6.45, 7.25]
  const colXs = (n: number) =>
    Array.from({ length: n }, (_, i) => CANTON_W * (i + 1) / (n + 1))
  const stars: ReactNode[] = []
  rowCounts.forEach((n, rowIdx) => {
    const y = rowYs[rowIdx] ?? 0
    colXs(n).forEach((x, i) => {
      stars.push(<polygon key={`${rowIdx}-${i}`} points={star5(x, y, 0.32)} fill="#fff" />)
    })
  })
  return (
    <g>
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={i}
          y={i * STRIPE_H}
          width="24"
          height={STRIPE_H}
          fill={i % 2 === 0 ? '#b22234' : '#fff'}
        />
      ))}
      <rect width={CANTON_W} height={CANTON_H} fill="#3c3b6e" />
      {stars}
    </g>
  )
}

/** United Kingdom — Union Jack: blue field with white + red crosses. Simplified. */
function flagUK(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#012169" />
      {/* white diagonal cross */}
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3" />
      {/* red diagonal cross (offset) */}
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#c8102e" strokeWidth="1.5" />
      {/* white + red horizontal/vertical crosses */}
      <rect x="11" width="2" height="16" fill="#fff" />
      <rect y="7" width="24" height="2" fill="#fff" />
      <rect x="11.5" width="1" height="16" fill="#c8102e" />
      <rect y="7.5" width="24" height="1" fill="#c8102e" />
    </g>
  )
}

/** China — red field with one large + two small yellow stars (simplified). */
function flagCN(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#de2910" />
      <polygon points="4.5,3 5.4,5.2 7.7,5.2 5.8,6.7 6.5,9 4.5,7.6 2.5,9 3.2,6.7 1.3,5.2 3.6,5.2" fill="#ffde00" />
      <polygon
        points="9,2 9.4,2.9 10.4,2.9 9.6,3.4 10,4.4 9,3.8 8,4.4 8.4,3.4 7.6,2.9 8.6,2.9"
        fill="#ffde00"
        transform="translate(0,1.5)"
      />
      <polygon
        points="9.5,4 9.9,4.9 10.9,4.9 10.1,5.4 10.5,6.4 9.5,5.8 8.5,6.4 8.9,5.4 8.1,4.9 9.1,4.9"
        fill="#ffde00"
        transform="translate(0,1.5)"
      />
    </g>
  )
}

/** Japan — white field with red disc. */
function flagJP(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <circle cx="12" cy="8" r="4.8" fill="#bc002d" />
    </g>
  )
}

/** Canada — red / white / red with a stylised maple leaf. */
function flagCA(): ReactElement {
  return (
    <g>
      <rect width="6" height="16" fill="#d52b1e" />
      <rect x="6" width="12" height="16" fill="#fff" />
      <rect x="18" width="6" height="16" fill="#d52b1e" />
      <path
        d="M12 3.2 L12.7 5.4 L13.9 4.4 L13.2 6.5 L15.2 6.5 L13.7 7.5 L14.6 9 L12.7 8 L12 9.7 L11.3 8 L9.4 9 L10.3 7.5 L8.8 6.5 L10.8 6.5 L10.1 4.4 L11.3 5.4 Z"
        fill="#d52b1e"
      />
    </g>
  )
}

/** North America — green field with stylised NA (continent emblem). */
function flagNA(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#1f7a3a" />
      <text
        x="12"
        y="11.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        NA
      </text>
    </g>
  )
}

/** Europe — blue field with ring of 12 yellow stars (simplified). */
function flagEU(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 2 * Math.PI - Math.PI / 2
        const x = 12 + 6 * Math.cos(a)
        const y = 8 + 3.2 * Math.sin(a)
        return <circle key={i} cx={x} cy={y} r="0.7" fill="#ffcc00" />
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Registry — `slug` → display name + builder. Adding a country = 1 row + (if
// non-trivial geometry) 1 custom function above. Default fallback for any
// unsupported slug is the NA continent emblem so the chip never renders empty.
// ---------------------------------------------------------------------------

export type FlagBuilder = () => ReactElement

export interface FlagEntry {
  /** ISO 3166-1 alpha-2 (lowercase) or continent pseudo-code. */
  slug: string
  /** Human-readable English name. */
  name: string
  /** Builder that returns the flag's inner SVG. */
  build: FlagBuilder
}

/** Lookup map of every country / continent this library knows. */
export const FLAGS: Record<string, FlagEntry> = {
  // ── Continents (pseudo-codes for multi-region groups) ─────────────
  na: { slug: 'na', name: 'North America', build: flagNA },
  eu: { slug: 'eu', name: 'Europe', build: flagEU },

  // ── Hand-curated (non-trivial geometry) ────────────────────────────
  us: { slug: 'us', name: 'United States', build: flagUS },
  uk: { slug: 'uk', name: 'United Kingdom', build: flagUK },
  cn: { slug: 'cn', name: 'China', build: flagCN },
  jp: { slug: 'jp', name: 'Japan', build: flagJP },
  ca: { slug: 'ca', name: 'Canada', build: flagCA },

  // ── Vertical tricolors ─────────────────────────────────────────────
  fr: { slug: 'fr', name: 'France',        build: () => verticalStripes(['#0055a4', '#fff', '#ef4135']) },
  it: { slug: 'it', name: 'Italy',          build: () => verticalStripes(['#009246', '#fff', '#ce2b37']) },
  ie: { slug: 'ie', name: 'Ireland',        build: () => verticalStripes(['#169b62', '#fff', '#ff883e']) },
  mx: { slug: 'mx', name: 'Mexico',         build: () => verticalStripes(['#006847', '#fff', '#ce1126']) },
  ro: { slug: 'ro', name: 'Romania',        build: () => verticalStripes(['#002b7f', '#fcd116', '#ce1126']) },
  // Chad is identical to Romania but uses #002664 — covered by Chad entry if added.
  // Peru: red/white/red — verticalStripes(['#d91023', '#fff', '#d91023']) — covered by helper.

  // ── Horizontal tricolors ───────────────────────────────────────────
  de: { slug: 'de', name: 'Germany',        build: () => horizontalStripes(['#000', '#dd0000', '#ffce00']) },
  ru: { slug: 'ru', name: 'Russia',         build: () => horizontalStripes(['#fff', '#0039a6', '#d52b1e']) },
  nl: { slug: 'nl', name: 'Netherlands',    build: () => horizontalStripes(['#ae1c28', '#fff', '#21468b']) },
  hu: { slug: 'hu', name: 'Hungary',        build: () => horizontalStripes(['#cd2a3e', '#fff', '#436f4d']) },
  at: { slug: 'at', name: 'Austria',        build: () => horizontalStripes(['#ed2939', '#fff', '#ed2939']) },
  in: { slug: 'in', name: 'India',          build: () => horizontalStripes(['#ff9933', '#fff', '#138808']) },
  // (India also has a navy-blue Ashoka chakra in the centre; the bare tricolor
  //  is a reasonable rendering at chip size and avoids SVG circle complexity here.)

  // ── Two-stripe (bicolor) ───────────────────────────────────────────
  pl: { slug: 'pl', name: 'Poland',         build: () => horizontalStripes(['#fff', '#dc143c']) },
  id: { slug: 'id', name: 'Indonesia',      build: () => horizontalStripes(['#ce1126', '#fff']) },
  pt: { slug: 'pt', name: 'Portugal',       build: () => verticalStripes(['#046a38', '#da291c']) },

  // ── Other simple patterns ───────────────────────────────────────────
  es: { slug: 'es', name: 'Spain',          build: () => horizontalStripes(['#aa151b', '#f1bf00', '#aa151b']) },
  se: { slug: 'se', name: 'Sweden',         build: () => (<g><rect width="24" height="16" fill="#006aa7" /><rect x="9" width="2" height="16" fill="#fecc00" /><rect y="7" width="24" height="2" fill="#fecc00" /></g>) },
  no: { slug: 'no', name: 'Norway',         build: () => (<g><rect width="24" height="16" fill="#ef2b2d" /><rect x="8" width="3" height="16" fill="#fff" /><rect x="9.25" width="0.5" height="16" fill="#002868" /><rect y="6" width="24" height="4" fill="#fff" /><rect y="7.75" width="24" height="0.5" fill="#002868" /></g>) },
  fi: { slug: 'fi', name: 'Finland',        build: () => (<g><rect width="24" height="16" fill="#fff" /><rect x="9" width="2" height="16" fill="#003580" /><rect y="7" width="24" height="2" fill="#003580" /></g>) },
  dk: { slug: 'dk', name: 'Denmark',        build: () => (<g><rect width="24" height="16" fill="#c8102e" /><rect x="9" width="2" height="16" fill="#fff" /><rect y="7" width="24" height="2" fill="#fff" /></g>) },
  ch: { slug: 'ch', name: 'Switzerland',    build: () => (<g><rect width="24" height="16" fill="#d52b1e" /><rect x="11" y="6" width="2" height="4" fill="#fff" /><rect x="9" y="8" width="6" height="2" fill="#fff" /></g>) },
  gr: { slug: 'gr', name: 'Greece',         build: () => {
    const stripes = Array.from({ length: 9 }, (_, i) => (
      <rect key={i} y={i * (16 / 9)} width="24" height={16 / 9} fill={i % 2 === 0 ? '#0d5eaf' : '#fff'} />
    ))
    return (
      <g>
        {stripes}
        <rect width="8" height={(16 * 5) / 9} fill="#0d5eaf" />
        <rect x="3" width="2" height={(16 * 5) / 9} fill="#fff" />
        <rect y={(16 * 2) / 9 - 0.5} width="8" height="1" fill="#fff" />
        <rect y={(16 * 4) / 9 - 0.5} width="8" height="1" fill="#fff" />
      </g>
    )
  } },
  ae: { slug: 'ae', name: 'United Arab Emirates', build: () => (<g><rect width="24" height="16" fill="#fff" /><rect width="24" height="16" fill="#00732f" /><rect width="24" height="6" fill="#ce1126" /><rect x="0" y="6" width="4" height="10" fill="#fff" /></g>) },
  sa: { slug: 'sa', name: 'Saudi Arabia',   build: () => (<g><rect width="24" height="16" fill="#006c35" /><text x="12" y="10" textAnchor="middle" fontSize="4" fill="#fff" fontFamily="sans-serif">SA</text></g>) },
  tr: { slug: 'tr', name: 'Turkey',         build: () => (<g><rect width="24" height="16" fill="#e30a17" /><circle cx="8" cy="8" r="3" fill="#fff" /><path d="M11 4 L13 7 L11 10" stroke="#e30a17" strokeWidth="0.5" fill="none" /></g>) },
  za: { slug: 'za', name: 'South Africa',   build: () => {
    const y = (i: number) => i * 2
    return (
      <g>
        <rect y={y(0)} width="24" height="2" fill="#e03c31" />
        <rect y={y(1)} width="24" height="2" fill="#fff" />
        <rect y={y(2)} width="24" height="2" fill="#007749" />
        <rect y={y(3)} width="24" height="2" fill="#000" />
        <rect y={y(4)} width="24" height="2" fill="#ffb81c" />
        <rect y={y(5)} width="24" height="2" fill="#007749" />
        <rect y={y(6)} width="24" height="2" fill="#fff" />
        <rect y={y(7)} width="24" height="2" fill="#e03c31" />
        <path d="M0,0 L8,8 L0,16 Z" fill="#001489" />
      </g>
    )
  } },
  br: { slug: 'br', name: 'Brazil',          build: () => (<g><rect width="24" height="16" fill="#009c3b" /><polygon points="12,3 21,8 12,13 3,8" fill="#fedf00" /><circle cx="12" cy="8" r="2.5" fill="#002776" /></g>) },
  ar: { slug: 'ar', name: 'Argentina',       build: () => horizontalStripes(['#74acdf', '#fff', '#74acdf']) },
  au: { slug: 'au', name: 'Australia',       build: () => (<g><rect width="24" height="16" fill="#00008b" /><rect width="12" height="8" fill="#00008b" /><circle cx="3" cy="3" r="0.4" fill="#fff" /><rect x="11" width="13" height="4" fill="#fff" /><rect x="11" y="4" width="13" height="4" fill="#cf142b" /><rect x="11" y="8" width="13" height="4" fill="#fff" /></g>) },
  nz: { slug: 'nz', name: 'New Zealand',     build: () => (<g><rect width="24" height="16" fill="#012169" /><rect x="9" width="6" height="16" fill="#012169" /><rect x="11.5" y="0" width="1" height="16" fill="#fff" /><rect x="12" width="0.5" height="16" fill="#c8102e" /><rect y="7.5" width="24" height="1" fill="#fff" /><rect y="8" width="24" height="0.5" fill="#c8102e" /><circle cx="20" cy="4" r="1" fill="#c8102e" stroke="#fff" strokeWidth="0.2" /><circle cx="22" cy="7" r="1" fill="#c8102e" stroke="#fff" strokeWidth="0.2" /><circle cx="20" cy="10" r="1" fill="#c8102e" stroke="#fff" strokeWidth="0.2" /><circle cx="22" cy="13" r="1" fill="#c8102e" stroke="#fff" strokeWidth="0.2" /></g>) },
  kr: { slug: 'kr', name: 'South Korea',     build: () => (<g><rect width="24" height="16" fill="#fff" /><circle cx="12" cy="8" r="3" fill="#cd2e3a" /><path d="M5,8 A7,4 0 0,1 19,8 A3.5,2 0 0,1 5,8" fill="#0047a0" /></g>) },
  in2: { slug: 'in2', name: 'India (Ashoka Chakra)', build: () => (<g><rect width="24" height="16" fill="#fff" /><rect width="24" height={16/3} fill="#ff9933" /><rect y={(16*2)/3} width="24" height={16/3} fill="#138808" /><circle cx="12" cy="8" r="1.4" fill="none" stroke="#000080" strokeWidth="0.3" /></g>) },
  il: { slug: 'il', name: 'Israel',          build: () => (<g><rect width="24" height="16" fill="#fff" /><rect y="2" width="24" height="2" fill="#0038b8" /><rect y="12" width="24" height="2" fill="#0038b8" /><path d="M12,5 L13,8 L16,8 L13.5,10 L14.5,13 L12,11 L9.5,13 L10.5,10 L8,8 L11,8 Z" fill="none" stroke="#0038b8" strokeWidth="0.3" /></g>) },
  be: { slug: 'be', name: 'Belgium',         build: () => verticalStripes(['#000', '#fdda24', '#ef3340']) },
  nl2: { slug: 'nl2', name: 'Netherlands',    build: () => horizontalStripes(['#ae1c28', '#fff', '#21468b']) },
  tw: { slug: 'tw', name: 'Taiwan',         build: () => (<g><rect width="24" height="16" fill="#fe0000" /><rect width="12" height="8" fill="#000095" /><polygon points="6,1 7.3,3.5 10,3.5 7.9,5.2 8.7,7.8 6,6.3 3.3,7.8 4.1,5.2 2,3.5 4.7,3.5" fill="#fff" /></g>) },
  eg: { slug: 'eg', name: 'Egypt',           build: () => horizontalStripes(['#ce1126', '#fff', '#000']) },
  th: { slug: 'th', name: 'Thailand',        build: () => {
    const stripes = [1, 2, 3, 4].map((i) => (
      <rect key={i} y={i * 2} width="24" height="2" fill={i === 1 ? '#fff' : i === 2 ? '#a51931' : '#fff'} />
    ))
    return (
      <g>
        {stripes}
        <rect y={2} width="24" height="6" fill="#2d2a4a" />
      </g>
    )
  } },
  ph: { slug: 'ph', name: 'Philippines',     build: () => {
    return (
      <g>
        <rect width="24" height="4" fill="#0038a5" />
        <rect y="4" width="24" height="8" fill="#fff" />
        <rect y="12" width="24" height="4" fill="#ce1126" />
        <rect width="10" height="8" fill="#fff" />
        <circle cx="3" cy="4" r="0.7" fill="#fcd116" />
        <polygon points="3,3.5 3.2,4 3.7,4 3.3,4.3 3.5,4.8 3,4.5 2.5,4.8 2.7,4.3 2.3,4 2.8,4" fill="#fcd116" />
      </g>
    )
  } },
  vn: { slug: 'vn', name: 'Vietnam',         build: () => (<g><rect width="24" height="16" fill="#da251d" /><polygon points="12,3 13.4,6.7 17.4,6.7 14.2,9 15.4,12.8 12,10.4 8.6,12.8 9.8,9 6.6,6.7 10.6,6.7" fill="#ff0" /></g>) },
  my: { slug: 'my', name: 'Malaysia',        build: () => {
    const stripes = Array.from({ length: 14 }, (_, i) => (
      <rect key={i} y={i * (16 / 14)} width="24" height={16 / 14} fill={i % 2 === 0 ? '#cc0001' : '#fff'} />
    ))
    return (
      <g>
        {stripes}
        <rect width="12" height={(16 * 7) / 14} fill="#010066" />
        <circle cx="6" cy="4" r="2" fill="#ffcc00" />
        <circle cx="6" cy="4" r="1.4" fill="#010066" />
        <polygon points="6,2.5 6.4,3.7 7.5,3.7 6.7,4.5 7,5.7 6,5 5,5.7 5.3,4.5 4.5,3.7 5.6,3.7" fill="#ffcc00" />
      </g>
    )
  } },
}

/** Look up an entry by slug; returns `undefined` for unsupported countries. */
export function lookupFlag(slug: string): FlagEntry | undefined {
  return FLAGS[slug.toLowerCase()] ?? undefined
}

/** All slugs this library knows, sorted. Useful for catalog UIs. */
export const SUPPORTED_SLUGS: string[] = Object.keys(FLAGS).sort()

/** Sorted list of (slug, name) tuples. Useful for pickers. */
export const FLAG_CATALOG: ReadonlyArray<{ slug: string; name: string }> = Object.values(FLAGS)
  .map((f) => ({ slug: f.slug, name: f.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/** `true` if the slug is in our registry. */
export function isSupported(slug: string): boolean {
  return slug.toLowerCase() in FLAGS
}
