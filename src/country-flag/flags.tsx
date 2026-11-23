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

/** India — saffron, white and green, with the navy Ashoka chakra. */
function flagIN(): ReactElement {
  const spokes: ReactNode[] = []
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12
    spokes.push(
      <line
        key={i}
        x1={12 + 0.55 * Math.cos(a)}
        y1={8 + 0.55 * Math.sin(a)}
        x2={12 + 2.25 * Math.cos(a)}
        y2={8 + 2.25 * Math.sin(a)}
        stroke="#000080"
        strokeWidth="0.12"
      />
    )
  }
  return (
    <g>
      <rect width="24" height="16" fill="#ff9933" />
      <rect y="5.33" width="24" height="5.34" fill="#fff" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      {spokes}
      <circle cx="12" cy="8" r="2.4" fill="none" stroke="#000080" strokeWidth="0.18" />
    </g>
  )
}

/** South Korea — the taegeuk and the four trigrams. */
function flagKR(): ReactElement {
  const R = 3.9
  const r = R / 2
  // The taegeuk is two lobes: the red one above, the blue one below, split by
  // an S made of two quarter arcs of radius r. (Drawing the red lobe first
  // and the blue on top would hide it — the two overlap at the S.)
  const red =
    `M${12},${8 - R} A${R},${R} 0 0 1 ${12},${8 + R}` +
    ` A${r},${r} 0 0 1 ${12},8 A${r},${r} 0 0 0 ${12},${8 - R} Z`
  const blue =
    `M${12},${8 + R} A${R},${R} 0 0 1 ${12},${8 - R}` +
    ` A${r},${r} 0 0 1 ${12},8 A${r},${r} 0 0 0 ${12},${8 + R} Z`
  // Each trigram is three bars; the group is turned to follow the circle.
  const trigram = (cx: number, cy: number, angle: number, key: string) => (
    <g key={key} transform={`rotate(${angle} ${cx} ${cy})`}>
      <rect x={cx - 1.2} y={cy - 1} width="2.4" height="0.5" fill="#000" />
      <rect x={cx - 1.2} y={cy - 0.25} width="2.4" height="0.5" fill="#000" />
      <rect x={cx - 1.2} y={cy + 0.5} width="2.4" height="0.5" fill="#000" />
    </g>
  )
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <path d={red} fill="#0047a0" />
      <path d={blue} fill="#cd2e3a" />
      {trigram(5.4, 4, -45, 'tl')}
      {trigram(18.6, 4, 45, 'tr')}
      {trigram(5.4, 12, 45, 'bl')}
      {trigram(18.6, 12, -45, 'br')}
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

/**
 * The emblem an unknown slug falls back to.
 *
 * A country we have no flag for (or a slug that was simply typed wrong)
 * draws the continent emblem instead of nothing — an empty chip reads as
 * a broken image, and a wrong flag would be worse still.
 */
export function flagFallback(): ReactElement {
  return flagNA()
}

// ---------------------------------------------------------------------------
// New shapes — the emblems a plain builder cannot reach.
// ---------------------------------------------------------------------------

/**
 * A crescent: the disc at (cx,cy,r) with the disc at (ox,oy,or) bitten out
 * of it, drawn as ONE path.
 *
 * Two circles, not a disc with a hole: the Algerian emblem straddles the
 * seam between the green and the white half, so a hole filled with the
 * background colour would show a seam of its own. A path keeps the shape
 * intact over any background.
 */
function crescentPath(cx: number, cy: number, r: number, ox: number, oy: number, or: number): string {
  const dx = ox - cx
  const dy = oy - cy
  const d = Math.hypot(dx, dy)
  const f = (n: number) => n.toFixed(2)
  // No overlap: a plain disc.
  if (d === 0 || d > r + or || d < Math.abs(r - or)) {
    return `M${f(cx - r)},${cy} a${r},${r} 0 1 0 ${f(2 * r)},0 a${r},${r} 0 1 0 ${f(-2 * r)},0 Z`
  }
  // The two circles meet at two points; the crescent is bounded by the far
  // arc of the big one and the near arc of the bite.
  const a = (r * r - or * or + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r * r - a * a))
  const ux = dx / d
  const uy = dy / d
  const px = cx + a * ux
  const py = cy + a * uy
  // The two intersections, one above the other on screen.
  const upx = px + h * uy
  const upy = py - h * ux
  const lox = px - h * uy
  const loy = py + h * ux
  return (
    `M${f(upx)},${f(upy)}` +
    ` A${r},${r} 0 1 0 ${f(lox)},${f(loy)}` +
    ` A${or},${or} 0 0 1 ${f(upx)},${f(upy)} Z`
  )
}

/** A five-pointed star's outline, as a path (for the stars drawn hollow). */
function starOutline(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  // Every second vertex: that is the pentagram, the way Morocco draws it.
  return `M${pts[0]} L${pts[2]} L${pts[4]} L${pts[1]} L${pts[3]} Z`
}

/** Pakistan — green field, white bar at the hoist, crescent and star. */
function flagPK(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#01411c" />
      <rect width="6" height="16" fill="#fff" />
      {/* The crescent's mouth faces up and to the right, as it does on the
          real flag, with the star tucked above its upper tip. */}
      <path d={crescentPath(13, 7.8, 4, 14.84, 5.96, 3.3)} fill="#fff" />
      <polygon points={star5(16.4, 4.75, 1.15)} fill="#fff" />
    </g>
  )
}

/** Singapore — red over white, crescent and five stars. */
function flagSG(): ReactElement {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return (
      <polygon
        key={i}
        points={star5(6.1 + 1.5 * Math.cos(a), 4.4 + 1.5 * Math.sin(a), 0.62)}
        fill="#fff"
      />
    )
  })
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="8" fill="#ed2939" />
      <path d={crescentPath(2.9, 4.9, 2.15, 4.3, 4.9, 1.7)} fill="#fff" />
      {stars}
    </g>
  )
}

/** Algeria — green and white halves, red crescent and star. */
function flagDZ(): ReactElement {
  return (
    <g>
      <rect width="12" height="16" fill="#006233" />
      <rect x="12" width="12" height="16" fill="#fff" />
      <path d={crescentPath(11.8, 8, 3.8, 13.9, 8, 3)} fill="#d21034" />
      <polygon points={star5(14.7, 8, 1.3)} fill="#d21034" />
    </g>
  )
}

/** Morocco — red field with the green pentagram. */
function flagMA(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#c1272d" />
      <path
        d={starOutline(12, 7.8, 3.7)}
        fill="none"
        stroke="#006233"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </g>
  )
}

/** Kuwait — green, white and red, with the black trapezoid at the hoist. */
function flagKW(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#007a3d" />
      <rect y="10.67" width="24" height="5.33" fill="#ce1126" />
      <polygon points="0,0 8,5.33 8,10.67 0,16" fill="#000" />
    </g>
  )
}

/** Qatar — maroon, with the white band at the hoist and its nine points. */
function flagQA(): ReactElement {
  // Nine white teeth biting into the maroon. The band's straight edge sits
  // at x = 7.05 and the tips reach x = 8.7 — measured off the real flag.
  const teeth: ReactNode[] = []
  const base = 7.05
  const reach = 8.7
  for (let i = 0; i < 9; i++) {
    const y0 = (i * 16) / 9
    const y1 = ((i + 1) * 16) / 9
    teeth.push(
      <polygon
        key={i}
        points={`${base},${y0.toFixed(2)} ${reach},${((y0 + y1) / 2).toFixed(2)} ${base},${y1.toFixed(2)}`}
        fill="#fff"
      />
    )
  }
  return (
    <g>
      <rect width="24" height="16" fill="#8a1538" />
      <rect width={base} height="16" fill="#fff" />
      {teeth}
    </g>
  )
}

/** Kenya — black, red and green with the white fimbriations and the shield. */
function flagKE(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#000" />
      <rect y="5.83" width="24" height="4.34" fill="#bb0000" />
      <rect y="10.67" width="24" height="5.33" fill="#006600" />
      <rect y="5.33" width="24" height="0.5" fill="#fff" />
      <rect y="10.17" width="24" height="0.5" fill="#fff" />
      {/* the crossed spears behind the shield */}
      <g stroke="#fff" strokeWidth="0.3" strokeLinecap="round">
        <line x1="9.3" y1="4.6" x2="14.7" y2="11.4" />
        <line x1="14.7" y1="4.6" x2="9.3" y2="11.4" />
      </g>
      <ellipse cx="12" cy="8" rx="2.5" ry="4.1" fill="#000" stroke="#fff" strokeWidth="0.4" />
      <ellipse cx="12" cy="8" rx="1" ry="2.5" fill="#bb0000" />
      <ellipse cx="12" cy="8" rx="0.4" ry="0.85" fill="#fff" />
    </g>
  )
}

/** Kazakhstan — the gold sun on the blue field. */
function flagKZ(): ReactElement {
  const rays: ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    rays.push(
      <line
        key={i}
        x1={11 + 2.4 * Math.cos(a)}
        y1={7.2 + 2.4 * Math.sin(a)}
        x2={11 + 3.7 * Math.cos(a)}
        y2={7.2 + 3.7 * Math.sin(a)}
        stroke="#ffec2d"
        strokeWidth="0.28"
      />
    )
  }
  // The ornamental band at the hoist: a gold strip with a row of knots.
  const band: ReactNode[] = []
  for (let i = 0; i < 8; i++) {
    const y = i * 2
    band.push(
      <g key={i}>
        <path
          d={`M0.7,${y} L1.8,${y + 1} L0.7,${y + 2} Z`}
          fill="#00abc2"
        />
        <path
          d={`M1.8,${y} L0.7,${y + 1} L1.8,${y + 2} Z`}
          fill="#00abc2"
        />
      </g>
    )
  }
  return (
    <g>
      <rect width="24" height="16" fill="#00abc2" />
      <rect x="0.7" width="1.1" height="16" fill="#ffec2d" />
      {band}
      {rays}
      <circle cx="11" cy="7.2" r="2.2" fill="#ffec2d" />
    </g>
  )
}

/** Croatia — the bands and the chequered shield. */
function flagHR(): ReactElement {
  const cells: ReactNode[] = []
  const x0 = 9.6
  const y0 = 2.6
  const cw = 0.96
  const ch = 1.16
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      cells.push(
        <rect
          key={`${row}-${col}`}
          x={x0 + col * cw}
          y={y0 + row * ch}
          width={cw}
          height={ch}
          fill={(row + col) % 2 === 0 ? '#fff' : '#ff0000'}
        />
      )
    }
  }
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#ff0000" />
      <rect y="10.67" width="24" height="5.33" fill="#171796" />
      {cells}
    </g>
  )
}

/** Czechia — white over red, with the blue wedge at the hoist. */
function flagCZ(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#d7141a" />
      <polygon points="0,0 11.85,8 0,16" fill="#11457e" />
    </g>
  )
}

/** Chile — white over red, with the blue canton and its star. */
function flagCL(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#d52b1e" />
      <rect width="8" height="8" fill="#0039a6" />
      <polygon points={star5(4, 4, 1.9)} fill="#fff" />
    </g>
  )
}

/** Uruguay — nine stripes and the sun in the canton. */
function flagUY(): ReactElement {
  const stripes = Array.from({ length: 9 }, (_, i) => (
    <rect key={i} y={(i * 16) / 9} width="24" height={16 / 9} fill={i % 2 === 0 ? '#fff' : '#0038a8'} />
  ))
  const rays: ReactNode[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    rays.push(
      <line
        key={i}
        x1={4.4 + 1.3 * Math.cos(a)}
        y1={4.35 + 1.3 * Math.sin(a)}
        x2={4.4 + 2.3 * Math.cos(a)}
        y2={4.35 + 2.3 * Math.sin(a)}
        stroke="#ffec2d"
        strokeWidth="0.22"
      />
    )
  }
  return (
    <g>
      {stripes}
      <rect width="9.6" height={16 / 9 * 4} fill="#fff" />
      {rays}
      <circle cx="4.4" cy="4.35" r="1.1" fill="#ffec2d" />
    </g>
  )
}

/** Bangladesh — green, with the red disc a little off centre. */
function flagBD(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#006a4e" />
      <circle cx="10.8" cy="8" r="4.9" fill="#f42a41" />
    </g>
  )
}

/** Sri Lanka — the yellow border, the green band, and the lion panel. */
function flagLK(): ReactElement {
  return (
    <g>
      <rect width="24" height="16" fill="#ffbe29" />
      <rect x="1.1" y="1.1" width="3" height="13.8" fill="#00534e" />
      <rect x="4.1" y="1.1" width="18.8" height="13.8" fill="#eb7400" />
      <rect x="8.55" y="1.1" width="14.35" height="13.8" fill="#8d153a" />
      {/* The lion, simplified to what survives at chip size: a standing cat
          in profile, head to the hoist, holding the sword up. */}
      <g fill="#ffbe29">
        <circle cx="11.8" cy="5.3" r="1.3" />
        <path d="M11.2 4.1 l-0.5 -1.1 l1.2 0.5 Z" />
        <path d="M12.3 4.4 l0.9 -0.7 l0.1 1.1 Z" />
        <path d="M12.6 6.1 l1.6 0.7 l-0.5 0.8 l-1.4 -0.6 Z" />
        <ellipse cx="15.4" cy="8.4" rx="2.5" ry="1.35" />
        <path d="M13.3 9.4 l0.85 0 l0.15 3 l-0.85 0 Z" />
        <path d="M14.6 9.4 l0.85 0 l0.05 3 l-0.85 0 Z" />
        <path d="M16.6 9.4 l0.85 0 l0.15 3 l-0.85 0 Z" />
        <path d="M17.7 9.4 l0.85 0 l-0.05 3 l-0.85 0 Z" />
        <path
          d="M17.7 7.6 q1.7 -0.9 1.9 0.8 q0.15 1.3 -0.9 1.5"
          fill="none"
          stroke="#ffbe29"
          strokeWidth="0.55"
          strokeLinecap="round"
        />
        {/* the sword, held up in the front paw */}
        <path d="M9.9 7.6 l0.75 -0.45 l2 -4.8 l0.75 0.3 l-2 4.8 Z" />
        <path d="M9.2 7.1 l2.3 -0.7 l0.2 0.65 l-2.3 0.7 Z" />
      </g>
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

/**
 * Slugs that are not registered under their own name but map onto one
 * that is.
 *
 * `uk` is the colloquial code for the United Kingdom, but ISO 3166-1
 * alpha-2 says `gb` — so `gb` is the registry key and `uk` stays an
 * alias. Without the alias, `<CountryFlag country="uk" />` renders an
 * empty box: the lookup misses, and an unknown slug deliberately draws
 * nothing rather than a wrong flag.
 */
export const FLAG_ALIASES: Record<string, string> = {
  uk: 'gb',
  // `in2` and `nl2` were duplicates of countries that already had a key of
  // their own — a second "India (Ashoka Chakra)" and a second "Netherlands".
  // They stay resolvable, but the registry keeps one row per country.
  in2: 'in',
  nl2: 'nl',
}

/** Resolves a slug (or an alias) to its registry key. */
function resolveSlug(slug: string): string {
  const key = slug.toLowerCase()
  return FLAG_ALIASES[key] ?? key
}

/** Lookup map of every country / continent this library knows. */export const FLAGS: Record<string, FlagEntry> = {
  // ── Continents (pseudo-codes for multi-region groups) ─────────────
  na: { slug: 'na', name: 'North America', build: flagNA },
  eu: { slug: 'eu', name: 'Europe', build: flagEU },

  // ── Hand-curated (non-trivial geometry) ────────────────────────────
  us: { slug: 'us', name: 'United States', build: flagUS },
  gb: { slug: 'gb', name: 'United Kingdom', build: flagUK },
  cn: { slug: 'cn', name: 'China', build: flagCN },
  jp: { slug: 'jp', name: 'Japan', build: flagJP },
  ca: { slug: 'ca', name: 'Canada', build: flagCA },
  in: { slug: 'in', name: 'India', build: flagIN },
  kr: { slug: 'kr', name: 'South Korea', build: flagKR },
  pk: { slug: 'pk', name: 'Pakistan', build: flagPK },
  sg: { slug: 'sg', name: 'Singapore', build: flagSG },
  dz: { slug: 'dz', name: 'Algeria', build: flagDZ },
  ma: { slug: 'ma', name: 'Morocco', build: flagMA },
  kw: { slug: 'kw', name: 'Kuwait', build: flagKW },
  qa: { slug: 'qa', name: 'Qatar', build: flagQA },
  ke: { slug: 'ke', name: 'Kenya', build: flagKE },
  kz: { slug: 'kz', name: 'Kazakhstan', build: flagKZ },
  hr: { slug: 'hr', name: 'Croatia', build: flagHR },
  cz: { slug: 'cz', name: 'Czechia', build: flagCZ },
  cl: { slug: 'cl', name: 'Chile', build: flagCL },
  uy: { slug: 'uy', name: 'Uruguay', build: flagUY },
  bd: { slug: 'bd', name: 'Bangladesh', build: flagBD },
  lk: { slug: 'lk', name: 'Sri Lanka', build: flagLK },

  // ── Vertical tricolors ─────────────────────────────────────────────
  fr: { slug: 'fr', name: 'France',        build: () => verticalStripes(['#0055a4', '#fff', '#ef4135']) },
  it: { slug: 'it', name: 'Italy',          build: () => verticalStripes(['#009246', '#fff', '#ce2b37']) },
  ie: { slug: 'ie', name: 'Ireland',        build: () => verticalStripes(['#169b62', '#fff', '#ff883e']) },
  mx: { slug: 'mx', name: 'Mexico',         build: () => verticalStripes(['#006847', '#fff', '#ce1126']) },
  ro: { slug: 'ro', name: 'Romania',        build: () => verticalStripes(['#002b7f', '#fcd116', '#ce1126']) },
  pe: { slug: 'pe', name: 'Peru',           build: () => verticalStripes(['#d91023', '#fff', '#d91023']) },
  ng: { slug: 'ng', name: 'Nigeria',        build: () => verticalStripes(['#008751', '#fff', '#008751']) },
  // Chad is identical to Romania but uses #002664 — covered by Chad entry if added.
  // Peru: red/white/red — verticalStripes(['#d91023', '#fff', '#d91023']) — covered by helper.

  // ── Horizontal tricolors ───────────────────────────────────────────
  de: { slug: 'de', name: 'Germany',        build: () => horizontalStripes(['#000', '#dd0000', '#ffce00']) },
  ru: { slug: 'ru', name: 'Russia',         build: () => horizontalStripes(['#fff', '#0039a6', '#d52b1e']) },
  nl: { slug: 'nl', name: 'Netherlands',    build: () => horizontalStripes(['#ae1c28', '#fff', '#21468b']) },
  hu: { slug: 'hu', name: 'Hungary',        build: () => horizontalStripes(['#cd2a3e', '#fff', '#436f4d']) },
  at: { slug: 'at', name: 'Austria',        build: () => horizontalStripes(['#ed2939', '#fff', '#ed2939']) },
  ua: { slug: 'ua', name: 'Ukraine',        build: () => horizontalStripes(['#0057b8', '#ffd700']) },
  bg: { slug: 'bg', name: 'Bulgaria',       build: () => horizontalStripes(['#fff', '#00966e', '#d62612']) },
  // Colombia and Ecuador share the same bands, with the yellow one twice the
  // height of the other two.
  co: { slug: 'co', name: 'Colombia',       build: () => (<g><rect width="24" height="8" fill="#fcd116" /><rect y="8" width="24" height="4" fill="#003893" /><rect y="12" width="24" height="4" fill="#ce1126" /></g>) },
  ec: { slug: 'ec', name: 'Ecuador',        build: () => (<g><rect width="24" height="8" fill="#ffdd00" /><rect y="8" width="24" height="4" fill="#034ea2" /><rect y="12" width="24" height="4" fill="#ed1c24" /></g>) },

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
  sa: { slug: 'sa', name: 'Saudi Arabia',   build: () => (<g><rect width="24" height="16" fill="#006c35" /><rect x="4.5" y="6" width="15" height="0.7" fill="#fff" /><rect x="5.5" y="7" width="12" height="0.45" fill="#fff" /><path d="M11.4 6.4 l0.5 0 l0.2 3 l-0.5 0 Z" fill="#fff" /><path d="M12.9 6.4 l0.5 0 l0.2 3 l-0.5 0 Z" fill="#fff" /><path d="M14.4 6.4 l0.5 0 l0.2 3 l-0.5 0 Z" fill="#fff" /><rect x="7.5" y="10.1" width="9" height="0.5" fill="#fff" transform="rotate(-6 12 10.3)" /></g>) },
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
  il: { slug: 'il', name: 'Israel',          build: () => (<g><rect width="24" height="16" fill="#fff" /><rect y="2" width="24" height="2" fill="#0038b8" /><rect y="12" width="24" height="2" fill="#0038b8" /><path d="M12,5 L13,8 L16,8 L13.5,10 L14.5,13 L12,11 L9.5,13 L10.5,10 L8,8 L11,8 Z" fill="none" stroke="#0038b8" strokeWidth="0.3" /></g>) },
  be: { slug: 'be', name: 'Belgium',         build: () => verticalStripes(['#000', '#fdda24', '#ef3340']) },
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
  return FLAGS[resolveSlug(slug)] ?? undefined
}

/** All slugs this library knows, sorted. Useful for catalog UIs. */
export const SUPPORTED_SLUGS: string[] = Object.keys(FLAGS).sort()

/** Sorted list of (slug, name) tuples. Useful for pickers. */
export const FLAG_CATALOG: ReadonlyArray<{ slug: string; name: string }> = Object.values(FLAGS)
  .map((f) => ({ slug: f.slug, name: f.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/** `true` if the slug is in our registry (or is an alias of an entry). */
export function isSupported(slug: string): boolean {
  const key = slug.toLowerCase()
  return key in FLAGS || key in FLAG_ALIASES
}
