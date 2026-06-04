'use client';

/**
 * Slim hero strip that greets the student at the top of the dashboard.
 *
 * Previously this mounted a full r3f Canvas + orbiting nav (see
 * `dashboard-avatar-3d.tsx`, retained for opt-in resurrection later). The
 * 3D version was demoted to a strip because:
 *  - it ate ~250KB of WebGL/shader assets the user only "saw" once,
 *  - it pushed the actually-useful dashboard cards below the fold,
 *  - the orbiting bubbles duplicated the sidebar nav.
 *
 * The strip stays light: initial + first name + a one-line value prop. No
 * dynamic import, no canvas, no per-frame cost.
 */
export function DashboardAvatarWrapper({ studentName }: { studentName?: string }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-emerald-50/40 dark:to-emerald-950/20 px-5 py-4 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary font-semibold">
        {(studentName ?? 'S').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">
          {studentName ? `Welcome, ${studentName.split(' ')[0]}` : 'Welcome back'}
        </div>
        <div className="text-xs text-muted-foreground">Your verified portfolio at a glance.</div>
      </div>
    </div>
  );
}
