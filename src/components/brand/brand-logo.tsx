import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  compact?: boolean;
}

export function BrandLogo({
  href = '/dashboard',
  subtitle = 'تصمیم‌یار هوشمند بازار',
  compact = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none"
      aria-label="BAZARA"
    >
      <span className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
        <Image
          src="/brand/bazara-logo-mark.png"
          alt="لوگوی BAZARA"
          fill
          sizes="48px"
          className="object-contain transition-transform duration-200 group-hover:scale-[1.04]"
          priority
        />
      </span>

      <span className="min-w-0">
        <span
          dir="ltr"
          className="block truncate text-base font-black tracking-tight text-[var(--nv-text)] sm:text-lg"
        >
          BAZARA
        </span>

        {!compact ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--nv-muted)] sm:text-xs">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}