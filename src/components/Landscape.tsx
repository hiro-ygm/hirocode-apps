/** Heroの右側に敷く風景イラスト（装飾）。色は styles.css の --scene-* で指定し、ダークモードにも追従する */
export function Landscape() {
  return (
    <svg
      className="hero__art"
      viewBox="0 0 960 300"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* 雲（丸い土台に円を重ねた同じ形を、位置と大きさを変えて3つ置く） */}
      <defs>
        <g id="scene-cloud-shape">
          <rect x="0" y="24" width="96" height="24" rx="12" />
          <circle cx="30" cy="26" r="18" />
          <circle cx="58" cy="21" r="21" />
          <circle cx="80" cy="33" r="13" />
        </g>
      </defs>
      <g className="scene-cloud">
        <use href="#scene-cloud-shape" transform="translate(250 58) scale(1.1)" />
        <use href="#scene-cloud-shape" transform="translate(590 42) scale(0.9)" />
        <use href="#scene-cloud-shape" transform="translate(432 124) scale(0.65)" />
      </g>
      <circle className="scene-sun" cx="820" cy="78" r="30" />

      {/* 丘（奥から手前へ） */}
      <path className="scene-hill-3" d="M300 300C420 230 520 205 640 214s200-40 320-96V300z" />
      <path className="scene-hill-2" d="M140 300c140-70 290-104 440-92 140 11 250 5 380-38V300z" />
      <path className="scene-path" d="M560 300c20-30 60-50 120-62 30-6 40-14 30-20 30 8 20 22-10 30-60 14-90 30-100 52z" />
      <path className="scene-hill-1" d="M0 300c180-40 340-52 520-38 160 12 300 4 440-24V300z" />

      {/* 家（左に妻壁、右に側面の壁と屋根）。妻壁の頂点と屋根の棟の始点を (24, 10) で揃える */}
      <g transform="translate(638 150)">
        <path className="scene-wall-side" d="M0 36 24 10l24 26v38H0z" />
        <path className="scene-wall" d="M48 36h56v38H48z" />
        <path className="scene-roof" d="M24 10h64l24 28H50z" />
        {/* 妻壁の斜辺に沿う縁取り（へ の字） */}
        <path className="scene-roof-trim" d="M-3 39 24 10l26 28" />
        <path className="scene-door" d="M17 52h14v22H17z" />
        <path className="scene-window" d="M62 48h14v12H62zM84 48h14v12H84z" />
      </g>

      {/* 木 */}
      <g className="scene-tree">
        <g transform="translate(560 160)">
          <rect className="scene-trunk" x="-2" y="40" width="4" height="24" rx="2" />
          <ellipse cx="0" cy="26" rx="14" ry="26" />
        </g>
        <g transform="translate(592 176)">
          <rect className="scene-trunk" x="-2" y="30" width="4" height="20" rx="2" />
          <ellipse cx="0" cy="18" rx="11" ry="20" />
        </g>
        <g transform="translate(880 110)">
          <rect className="scene-trunk" x="-2.5" y="46" width="5" height="30" rx="2" />
          <ellipse cx="0" cy="30" rx="18" ry="32" />
        </g>
        <g transform="translate(918 150)">
          <rect className="scene-trunk" x="-2" y="30" width="4" height="22" rx="2" />
          <ellipse cx="0" cy="20" rx="11" ry="21" />
        </g>
      </g>
    </svg>
  )
}
