/**
 * 사이트 공용 아이콘 (인라인 SVG, 의존성 없음).
 * 전부 장식용이라 aria-hidden 이고, 뜻은 옆의 글자나 aria-label 이 전달한다.
 */

type IconProps = { className?: string };

function Svg({ className = "size-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function ChatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </Svg>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function MapPinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function CameraIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  );
}

export function CheckCircleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Svg>
  );
}

export function UtensilsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 3v5a2 2 0 0 0 4 0V3M7 10v11" />
      <path d="M17 21V3c-2 0-3.5 2.5-3.5 6v4H17" />
    </Svg>
  );
}

export function BoxIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </Svg>
  );
}

export function MegaphoneIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 10v4h3l6 4V6L6 10z" />
      <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
    </Svg>
  );
}

export function SparklesIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </Svg>
  );
}

export function PhotoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 16-5-5-8 8" />
    </Svg>
  );
}

export function MessageIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z" />
    </Svg>
  );
}

export function InstagramIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** NAV_ITEMS 의 경로별 아이콘. 홈 서비스 타일 · 더보기 시트가 같이 쓴다. */
export const NAV_ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  "/lost-found": BoxIcon,
  "/board": MegaphoneIcon,
  "/monthly": SparklesIcon,
  "/archive": PhotoIcon,
  "/requests": MessageIcon,
  "/calendar": CalendarIcon,
};
