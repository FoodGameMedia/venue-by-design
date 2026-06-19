/**
 * Hand-drawn style line art for site-wide cityscape backgrounds.
 * Uses illustration palette only — not UI champagne/rose/plum tokens.
 */

import { CITYSCAPE_COLORS } from "@/components/sales/cityscape-palette";

const C = CITYSCAPE_COLORS;

type LayerProps = {
  className?: string;
};

type PanoramaProps = LayerProps & {
  lineOpacity?: number;
  fillOpacity?: number;
};

/** Distant buildings, rooftops, power lines — faintest layer */
export function CityscapeFarLayer({ className }: LayerProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1200 400"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sky watercolor washes */}
      <ellipse cx="280" cy="95" rx="220" ry="55" fill={C.sky} opacity="0.32" />
      <ellipse cx="720" cy="75" rx="280" ry="48" fill={C.sky} opacity="0.28" />
      <ellipse cx="1020" cy="110" rx="160" ry="40" fill={C.sky} opacity="0.25" />

      {/* Power lines */}
      <path
        d="M0 68 Q180 62 360 70 T720 65 T1080 72 T1200 68"
        stroke={C.slate}
        strokeWidth="1.5"
        strokeOpacity="0.82"
        strokeLinecap="round"
      />
      <path
        d="M0 82 Q200 76 400 84 T800 79 T1200 84"
        stroke={C.slate}
        strokeWidth="1.2"
        strokeOpacity="0.75"
        strokeLinecap="round"
      />
      <path d="M120 68 L118 110" stroke={C.sepiaLight} strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M340 70 L338 108" stroke={C.sepiaLight} strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M580 66 L578 112" stroke={C.sepiaLight} strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M860 72 L858 114" stroke={C.sepiaLight} strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M1040 70 L1038 108" stroke={C.sepiaLight} strokeWidth="1.2" strokeOpacity="0.8" />

      {/* Distant skyline */}
      <path
        d="M0 280 L0 180 L45 180 L45 155 L78 155 L78 130 L110 130 L110 165 L145 165 L145 120 L175 120 L175 95 L210 95 L210 140 L250 140 L250 110 L285 110 L285 85 L320 85 L320 150 L360 150 L360 125 L395 125 L395 100 L430 100 L430 170 L470 170 L470 135 L505 135 L505 90 L540 90 L540 155 L580 155 L580 120 L615 120 L615 95 L650 95 L650 160 L690 160 L690 130 L725 130 L725 105 L760 105 L760 175 L800 175 L800 140 L835 140 L835 115 L870 115 L870 165 L910 165 L910 130 L945 130 L945 100 L980 100 L980 155 L1020 155 L1020 125 L1055 125 L1055 90 L1090 90 L1090 170 L1125 170 L1125 145 L1160 145 L1160 120 L1200 120 L1200 280 Z"
        stroke={C.slate}
        strokeWidth="1.5"
        strokeOpacity="0.8"
        strokeLinejoin="round"
        fill={C.slate}
        fillOpacity="0.1"
      />
      <path
        d="M145 165 L145 120 L175 120 L175 95 L210 95 L210 140 L250 140 L250 110 L285 110 L285 85 L320 85 L320 150 L360 150"
        stroke={C.sepiaLight}
        strokeWidth="0.7"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path d="M175 95 L175 72 L182 72 L182 95" stroke={C.sepiaDark} strokeWidth="0.7" />
      <path d="M505 90 L505 68 L512 68 L512 90" stroke={C.sepiaDark} strokeWidth="0.7" />
      <path d="M760 105 L760 78" stroke={C.slate} strokeWidth="0.6" strokeDasharray="2 3" />
      <path d="M945 100 L945 75 L952 75 L952 100" stroke={C.sepiaDark} strokeWidth="0.7" />

      <path
        d="M180 42 Q210 36 240 42 Q270 48 300 42"
        stroke={C.sky}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M720 38 Q760 32 800 38 Q840 44 880 38"
        stroke={C.sky}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Mid-ground street: façades, awnings, pedestrians */
export function CityscapeMidLayer({ className }: LayerProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1200 500"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 420 L1200 420"
        stroke={C.sepiaLight}
        strokeWidth="1.6"
        strokeOpacity="0.85"
        strokeLinecap="round"
      />

      {/* Left building block */}
      <path
        d="M0 420 L0 260 L85 260 L85 220 L95 220 L95 260 L180 260 L180 420"
        stroke={C.sepiaLight}
        strokeWidth="1.4"
        strokeOpacity="0.82"
        strokeLinejoin="round"
        fill={C.sepiaLight}
        fillOpacity="0.08"
      />
      <path d="M30 260 L30 295 M55 260 L55 310 M80 260 L80 285" stroke={C.sepiaDark} strokeWidth="0.7" opacity="0.8" />
      <path
        d="M95 220 L95 210 Q140 200 185 210 L185 220 Z"
        stroke={C.sage}
        strokeWidth="1.1"
        strokeOpacity="0.8"
        strokeLinejoin="round"
        fill={C.sage}
        fillOpacity="0.28"
      />
      <path d="M110 210 L110 205 M130 207 L130 202 M150 208 L150 203 M170 207 L170 202" stroke={C.sage} strokeWidth="0.5" opacity="0.7" />

      {/* Centre-left venue storefront */}
      <path
        d="M180 420 L180 240 L320 240 L320 420"
        stroke={C.sepiaLight}
        strokeWidth="1.4"
        strokeOpacity="0.82"
        strokeLinejoin="round"
      />
      <path
        d="M210 420 L210 290 L280 290 L280 420"
        stroke={C.sepiaLight}
        strokeWidth="0.9"
        strokeLinejoin="round"
        fill={C.ochre}
        fillOpacity="0.08"
      />
      <path d="M245 290 L245 420" stroke={C.sepiaDark} strokeWidth="0.6" opacity="0.7" />
      <path
        d="M200 248 Q245 238 290 248"
        stroke={C.terracotta}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path d="M215 248 L215 268 M275 248 L275 268" stroke={C.terracotta} strokeWidth="0.6" />

      {/* Centre building with balcony */}
      <path
        d="M320 420 L320 200 L480 200 L480 420"
        stroke={C.sepiaLight}
        strokeWidth="1.4"
        strokeOpacity="0.8"
        strokeLinejoin="round"
      />
      <path d="M340 280 L340 260 L460 260 L460 280" stroke={C.slate} strokeWidth="0.8" />
      <path d="M360 260 L360 240 M390 260 L390 242 M420 260 L420 244 M450 260 L450 242" stroke={C.slate} strokeWidth="0.6" />
      <path d="M335 320 L335 310 L465 310 L465 320" stroke={C.sepiaDark} strokeWidth="0.7" />
      <path d="M350 320 L350 310 M380 320 L380 310 M410 320 L410 310 M440 320 L440 310" stroke={C.sepiaDark} strokeWidth="0.5" opacity="0.7" />

      {/* Right-side corner eatery */}
      <path
        d="M480 420 L480 230 L620 230 L620 195 L640 195 L640 230 L780 230 L780 420"
        stroke={C.sepiaLight}
        strokeWidth="1.4"
        strokeOpacity="0.82"
        strokeLinejoin="round"
      />
      <path
        d="M620 195 L620 182 Q700 168 780 182 L780 195"
        stroke={C.terracotta}
        strokeWidth="1.2"
        strokeOpacity="0.8"
        strokeLinecap="round"
        fill={C.terracotta}
        fillOpacity="0.3"
      />
      <path d="M635 188 L635 178 M665 184 L665 174 M695 180 L695 170 M725 184 L725 174 M755 188 L755 178" stroke={C.ochre} strokeWidth="0.45" opacity="0.75" />
      <rect x="655" y="248" width="52" height="38" rx="2" stroke={C.ochre} strokeWidth="0.7" fill={C.ochre} fillOpacity="0.1" />
      <path d="M662 258 L695 258 M662 268 L688 268 M662 278 L692 278" stroke={C.sepiaDark} strokeWidth="0.5" opacity="0.7" />

      {/* Far right building */}
      <path
        d="M780 420 L780 270 L920 270 L920 250 L940 250 L940 270 L1080 270 L1080 420"
        stroke={C.slate}
        strokeWidth="1.3"
        strokeOpacity="0.78"
        strokeLinejoin="round"
      />
      <path d="M810 270 L810 310 M850 270 L850 320 M890 270 L890 305 M930 270 L930 315" stroke={C.slate} strokeWidth="0.65" opacity="0.8" />

      {/* Street tree */}
      <path d="M520 420 L520 380 Q520 365 535 365 Q550 365 550 380 L550 420" stroke={C.sepiaDark} strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="535" cy="378" rx="18" ry="6" stroke={C.sage} strokeWidth="0.8" fill={C.sage} fillOpacity="0.2" />

      {/* Pedestrians — cream silhouettes, ink outline */}
      <g fill={C.cream} stroke={C.ink} strokeWidth="0.75" strokeLinecap="round" opacity="0.9">
        <path d="M420 395 Q422 388 425 382 Q428 376 432 378 Q436 380 438 388 Q440 396 438 404 Q436 412 430 416 Q424 420 420 412 Q416 404 418 398 Z" />
        <path d="M455 418 Q458 410 462 404 Q466 400 470 404 Q474 408 476 416 Q478 424 474 430 Q470 436 464 434 Q458 432 454 424 Q452 416 455 418" />
        <path d="M395 422 Q392 416 388 412 Q384 410 380 414 Q378 420 382 426 Q388 432 395 428 Q398 424 395 422" />
      </g>

      {/* Outdoor dining — terracotta tables */}
      <path d="M600 408 L640 408 M620 408 L620 398 M610 398 L630 398" stroke={C.terracotta} strokeWidth="0.65" opacity="0.85" />
      <path d="M665 410 L695 410 M680 410 L680 400 M672 400 L688 400" stroke={C.terracotta} strokeWidth="0.6" opacity="0.8" />

      {/* Hanging lantern */}
      <path d="M710 195 L710 215 Q710 225 700 225 L690 225" stroke={C.sepiaDark} strokeWidth="0.6" />
      <path
        d="M700 225 Q700 235 710 235 Q720 235 720 225 Q720 215 710 215"
        stroke={C.ochre}
        strokeWidth="0.65"
        fill={C.ochre}
        fillOpacity="0.2"
      />

      {/* Tree sketch */}
      <path d="M1050 420 L1050 360 Q1040 340 1050 320 Q1060 340 1050 360" stroke={C.sage} strokeWidth="0.8" strokeLinejoin="round" fill={C.sage} fillOpacity="0.12" />
      <path d="M1035 350 Q1025 335 1038 328 M1065 345 Q1078 332 1062 325" stroke={C.sage} strokeWidth="0.55" opacity="0.65" />

      {/* Coral flower pot accent */}
      <ellipse cx="1088" cy="408" rx="10" ry="6" fill={C.coral} opacity="0.35" />
    </svg>
  );
}

/** Foreground corner detail — strongest layer */
export function CityscapeNearLayer({ className }: LayerProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 800 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 600 L0 320 L120 320 L120 280 L140 280 L140 320 L280 320 L280 600"
        stroke={C.sepiaDark}
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill={C.sepiaLight}
        fillOpacity="0.04"
      />

      <path
        d="M40 600 L40 380 L115 380 L115 600"
        stroke={C.sepiaLight}
        strokeWidth="1.4"
        strokeOpacity="0.82"
        strokeLinejoin="round"
      />
      <path d="M77 380 L77 600" stroke={C.sepiaLight} strokeWidth="0.7" opacity="0.75" />
      <circle cx="95" cy="490" r="2.5" stroke={C.ochre} strokeWidth="0.6" fill={C.ochre} fillOpacity="0.4" />

      <path
        d="M145 340 L145 310 L210 310 L210 340 Z"
        stroke={C.terracotta}
        strokeWidth="0.85"
        strokeLinejoin="round"
        fill={C.terracotta}
        fillOpacity="0.12"
      />
      <path d="M155 318 L200 318 M155 326 L195 326 M155 334 L188 334" stroke={C.sepiaDark} strokeWidth="0.5" opacity="0.75" />

      <path
        d="M30 420 L30 400 L105 400 L105 420"
        stroke={C.ochre}
        strokeWidth="0.75"
        opacity="0.85"
        fill={C.ochre}
        fillOpacity="0.1"
      />
      <path d="M45 410 L90 410 M67 400 L67 420" stroke={C.ochre} strokeWidth="0.45" opacity="0.55" />

      <path
        d="M0 280 L0 268 Q60 252 120 268 L120 280"
        stroke={C.sage}
        strokeWidth="1"
        strokeLinecap="round"
        fill={C.sage}
        fillOpacity="0.16"
      />
      <path d="M15 270 L15 262 M35 266 L35 258 M55 268 L55 260 M75 266 L75 258 M95 270 L95 262" stroke={C.sage} strokeWidth="0.45" opacity="0.7" />

      <path d="M260 600 L260 480" stroke={C.sepiaDark} strokeWidth="1" />
      <path d="M248 480 Q260 468 272 480" stroke={C.sepiaLight} strokeWidth="0.9" />
      <path d="M252 492 Q260 486 268 492" stroke={C.ochre} strokeWidth="0.55" opacity="0.65" />

      <g fill={C.cream} stroke={C.ink} strokeWidth="0.8" strokeLinejoin="round" opacity="0.92">
        <path d="M300 560 Q298 540 302 520 Q306 508 312 512 Q318 516 316 530 Q314 544 318 560 L318 600 L292 600 L292 560 Q290 548 300 560" />
        <path d="M302 512 Q300 502 306 496 Q312 492 316 498" strokeWidth="0.65" strokeLinecap="round" fill="none" />
        <path d="M340 565 Q338 545 344 528 Q350 518 356 524 Q362 530 360 546 Q358 558 362 572 L362 600 L334 600 L334 572 Q332 560 340 565" />
        <path d="M344 528 Q342 518 348 512 Q354 508 358 514" strokeWidth="0.65" strokeLinecap="round" fill="none" />
      </g>

      <path d="M400 590 L480 590" stroke={C.terracotta} strokeWidth="0.7" />
      <path d="M440 590 L440 575 M425 575 L455 575" stroke={C.terracotta} strokeWidth="0.6" opacity="0.8" />
      <path d="M415 590 L415 600 M465 590 L465 600" stroke={C.sepiaDark} strokeWidth="0.5" opacity="0.65" />
      <path d="M430 582 Q428 574 432 568 Q436 562 440 568 Q444 574 442 582" stroke={C.coral} strokeWidth="0.55" opacity="0.75" />
      <ellipse cx="452" cy="580" rx="8" ry="3" stroke={C.terracotta} strokeWidth="0.5" opacity="0.65" />

      <path d="M180 600 L220 600 M240 600 L280 600 M300 600 L340 600 M360 600 L400 600 M420 600 L460 600 M480 600 L520 600 M540 600 L580 600 M600 600 L640 600 M660 600 L700 600 M720 600 L760 600 M780 600 L800 600" stroke={C.sepiaDark} strokeWidth="0.35" opacity="0.45" strokeDasharray="4 8" />

      <path
        d="M520 600 L520 350 L680 350 L680 310 L700 310 L700 350 L800 350 L800 600"
        stroke={C.slate}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path d="M550 350 L550 390 M590 350 L590 400 M630 350 L630 385 M670 350 L670 395" stroke={C.slate} strokeWidth="0.55" opacity="0.65" />
      <path
        d="M560 318 Q620 302 680 318"
        stroke={C.terracotta}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path d="M575 318 L575 332 M615 310 L615 326 M655 318 L655 332" stroke={C.ochre} strokeWidth="0.5" opacity="0.65" />
    </svg>
  );
}

/** Compact horizontal strip for section dividers */
export function CityscapeDividerStrip({ className }: LayerProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1200 48"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 36 L80 36 L80 28 L95 28 L95 36 M115 36 L115 26 L130 26 L130 36 M155 36 L155 28 L170 28 L170 36 M200 36 L200 24 L215 24 L215 36 M245 36 L245 30 L260 30 L260 36 M290 36 L290 28 L305 28 L305 36 M335 36 L335 26 L350 26 L350 36 M380 36 L380 30 L395 30 L395 36 M420 36 L420 28 L435 28 L435 36 M470 36 L470 32 L485 32 L485 36 M520 36 L520 26 L535 26 L535 36 M570 36 L570 32 L585 32 L585 36 M620 38 L625 34 L640 34 L655 38 L670 34 L685 38 M720 38 L735 32 L750 32 L765 38 L780 32 L795 32 L810 38 L825 32 L840 38 L855 32 L870 38 L885 32 L900 38 L915 32 L930 38 L945 32 L960 38 L975 32 L990 38 L1005 32 L1020 38 L1035 32 L1050 38 L1065 32 L1080 38 L1095 32 L1110 38 L1125 38 L1140 32 L1155 38 L1170 32 L1185 38 L1200 38"
        stroke={C.sepiaLight}
        strokeWidth="1.5"
        strokeOpacity="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M0 24 Q300 18 600 22 T900 20 L1200 24" stroke={C.sky} strokeWidth="0.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Full panoramic stack for site-wide fixed background */
export function CityscapePanorama({
  className,
  lineOpacity = 0.8,
  fillOpacity = 0.35,
}: PanoramaProps) {
  const layerStyle = {
    opacity: lineOpacity,
    mixBlendMode: "normal" as const,
  };
  const washStyle = {
    opacity: fillOpacity,
    mixBlendMode: "normal" as const,
  };

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div className="absolute inset-x-0 top-0 h-[52%]" style={washStyle}>
        <CityscapeFarLayer className="h-full w-full" />
      </div>
      <div className="absolute inset-x-[-4%] bottom-0 h-[72%] w-[108%]" style={layerStyle}>
        <CityscapeMidLayer className="h-full w-full" />
      </div>
      <div
        className="absolute -bottom-2 -left-[6%] h-[74%] w-[68%]"
        style={{ ...layerStyle, opacity: Math.min(lineOpacity * 1.1, 1) }}
      >
        <CityscapeNearLayer className="h-full w-full" />
      </div>
    </div>
  );
}
