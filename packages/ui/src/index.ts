// Re-exports for shared UI utilities used by both web and any future portal apps.
// shadcn primitives live in apps/web/components/ui — they're framework-coupled
// (Next.js + RSC) so we don't lift them into this package yet.
export * from './utils';
