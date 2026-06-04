import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Round avatar used across the messages pages. Shows the image when present,
 * falls back to initials, then to a generic user glyph. Extracted to its own
 * module because Next.js page files may not export named components (it trips
 * the generated route-type constraint), and both the inbox page and the
 * thread page need it.
 */
export function Avatar({
  avatarUrl,
  fullName,
  size = 'md',
}: {
  avatarUrl: string | null;
  fullName: string;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-sm';
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={cn('rounded-full object-cover shrink-0', cls)} />;
  }
  const initials = fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (!initials)
    return (
      <div className={cn('rounded-full bg-secondary grid place-items-center shrink-0', cls)}>
        <UserIcon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </div>
    );
  return (
    <div
      className={cn(
        'rounded-full bg-primary/20 text-primary grid place-items-center font-semibold shrink-0',
        cls,
      )}
    >
      {initials}
    </div>
  );
}
