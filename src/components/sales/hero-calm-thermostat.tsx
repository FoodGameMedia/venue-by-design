export function HeroCalmThermostat() {
  return (
    <svg
      width="160"
      viewBox="0 0 170 200"
      role="img"
      aria-label="Calm Index thermostat at 7.4 out of 10, designed for calm"
      data-testid="sales-hero-thermostat"
      className="mx-auto shrink-0 drop-shadow-[0_12px_36px_rgba(201,168,124,0.28),0_8px_24px_rgba(214,150,169,0.2)] lg:mx-0"
    >
      <defs>
        <linearGradient id="cvfill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8B3A52" />
          <stop offset="0.45" stopColor="#D696A9" />
          <stop offset="1" stopColor="#C9A87C" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse
        cx="33"
        cy="115"
        rx="28"
        ry="70"
        fill="rgba(201,168,124,0.12)"
        filter="url(#glow)"
      />
      <rect x="22" y="14" width="22" height="162" rx="11" fill="rgba(245,237,232,0.14)" />
      <rect x="22" y="56" width="22" height="120" rx="11" fill="url(#cvfill)" />
      <rect x="15" y="54" width="36" height="3" rx="1.5" fill="#C9A87C" />
      <text x="62" y="74" fontFamily="'DM Serif Display',Georgia,serif" fontSize="42" fill="#F5EDE8">
        7.4
        <tspan fontSize="16" fill="rgba(201,168,124,0.85)">
          {" "}
          /10
        </tspan>
      </text>
      <text x="63" y="98" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#C9A87C">
        Designed for calm
      </text>
    </svg>
  );
}
