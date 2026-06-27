/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@skillverify/shared', '@skillverify/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // The marketing landing page is a self-contained static site
  // (public/landing/{index.html,styles.css,main.js,frames/}) — a scroll-driven
  // film build with no React. Serve it at the root URL. `beforeFiles` runs the
  // rewrite ahead of the app router, so `/` resolves to the static file while
  // every other route (/signup, /login, /dashboard, …) is unaffected.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/landing/index.html' }],
    };
  },
};
export default nextConfig;
