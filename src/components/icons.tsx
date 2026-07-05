import type { SVGProps } from 'react';

/**
 * Eigenes Icon-Set im Lucide-Stil: 24er-Viewbox, stroke=currentColor,
 * runde Kappen. Ersetzt sämtliche Emojis im UI durch konsistente Grafik.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const IconPinFilled = (p: IconProps) => (
  <Svg {...p} fill="currentColor" strokeWidth={0}>
    <path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
  </Svg>
);

export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
  </Svg>
);

export const IconStarFilled = (p: IconProps) => (
  <Svg {...p} fill="currentColor" strokeWidth={0}>
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </Svg>
);

export const IconHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.3a5 5 0 1 1 7.5 6.3Z" />
  </Svg>
);

export const IconSwords = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="m16 16 4 4" />
    <path d="m19 21 2-2" />
  </Svg>
);

export const IconGauge = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 14 8.5 8.5" />
    <path d="M4 14a8 8 0 1 1 16 0" />
    <path d="M4 14h2m12 0h2M12 6v2" />
  </Svg>
);

export const IconTimer = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 2h6" />
  </Svg>
);

export const IconEgg = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22c4 0 7-3.1 7-7.5C19 9.5 15.5 2 12 2S5 9.5 5 14.5C5 18.9 8 22 12 22Z" />
  </Svg>
);

export const IconDrumstick = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.4 15.6a7 7 0 1 0-7-7c0 1.5.5 2.9 1.3 4L4 18.3l-.4 2.1 2.1-.4 5.7-5.7c1.1.8 2.5 1.3 4 1.3Z" />
  </Svg>
);

export const IconFlask = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 2v6L4.5 17.5A3 3 0 0 0 7.1 22h9.8a3 3 0 0 0 2.6-4.5L14 8V2" />
    <path d="M8 2h8" />
    <path d="M7 15h10" />
  </Svg>
);

export const IconBerry = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="15" r="4" />
    <circle cx="15.5" cy="14" r="3.2" />
    <path d="M11 8c0-3 1.5-5 4-6 .5 2.5-.5 4.8-2.5 6" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Svg>
);

export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 21h8m-4-4v4" />
    <path d="M17 4H7v5a5 5 0 0 0 10 0V4Z" />
    <path d="M17 5h3a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4M7 5H4a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4" />
  </Svg>
);

export const IconSparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9 12 3.5Z" />
    <path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const IconNote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </Svg>
);

export const IconWarning = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 1.8 20.2h20.4L12 3Z" />
    <path d="M12 10v4m0 3v.5" />
  </Svg>
);

/** Stilisierter Dino-Schädel fürs Logo (fill-basiert). */
export const IconSkull = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.6}>
    <path d="M4 10.5C4 6.4 7.4 3 11.5 3c4.7 0 8.5 3.6 8.5 8v2.5L17 15v3.5c0 1.4-1.1 2.5-2.5 2.5h-1L13 18.5 11.5 21h-1C9.1 21 8 19.9 8 18.5V16l-3-2.2c-.6-.9-1-2-1-3.3Z" />
    <circle cx="9" cy="11" r="1.3" fill="currentColor" strokeWidth={0} />
    <path d="M14 12.5 20 13" />
  </Svg>
);
