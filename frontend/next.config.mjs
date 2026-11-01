// Uploaded images live outside /public: the API's /uploads locally, Cloudflare R2 in production.
// next/image only optimises remote images from hosts listed here.
const hosts = [process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api", process.env.NEXT_PUBLIC_UPLOAD_URL]
  .filter(Boolean)
  .map((u) => new URL(u));

// shortcut: no script-src CSP — Next's inline scripts need nonces; add one if the site ever renders user-supplied HTML.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }, // browsers ignore it over http (local)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
  images: {
    remotePatterns: hosts.map((u) => ({ protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port, pathname: "/**" })),
  },
};

export default nextConfig;
