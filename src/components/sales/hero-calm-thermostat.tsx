export function HeroCalmThermostat() {
  return (
    <svg
      width="160"
      viewBox="0 0 170 200"
      role="img"
      aria-label="Calm Index thermostat at 7.4 out of 10, designed for calm"
      data-testid="sales-hero-thermostat"
      className="mx-auto shrink-0 lg:mx-0"
    >
      <defs>
        <linearGradient id="cvfill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8B3A52" />
          <stop offset="1" stopColor="#D696A9" />
        </linearGradient>
      </defs>
      <rect x="22" y="14" width="22" height="162" rx="11" fill="rgba(245,237,232,0.14)" />
      <rect x="22" y="56" width="22" height="120" rx="11" fill="url(#cvfill)" />
      <rect x="15" y="54" width="36" height="3" rx="1.5" fill="#F5EDE8" />
      <text x="62" y="74" fontFamily="'DM Serif Display',Georgia,serif" fontSize="42" fill="#F5EDE8">
        7.4
        <tspan fontSize="16" fill="rgba(245,237,232,0.6)">
          {" "}
          /10
        </tspan>
      </text>
      <text x="63" y="98" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#D696A9">
        Designed for calm
      </text>
    </svg>
  );
}
