import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The app shipped with none of these: no CSP, no HSTS, no framing protection,
 * no MIME-sniffing protection. Everything below is standard and none of it
 * changes how the app behaves, with one deliberate exception noted on
 * `script-src`.
 */

/** Only the origins the browser actually talks to. Anything else is blocked. */
function connectOrigins(): string[] {
  const origins = ["'self'"];

  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabase) {
    try {
      const { origin } = new URL(supabase);
      origins.push(origin);
      // Supabase Realtime, if it is ever switched on, speaks over websockets.
      origins.push(origin.replace(/^https:/, "wss:"));
    } catch {
      // A malformed URL should not take the build down; the origin is simply
      // not allow-listed, which fails closed.
    }
  }

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (sentryDsn) {
    try {
      origins.push(new URL(sentryDsn).origin);
    } catch {
      // Same reasoning.
    }
  }

  return origins;
}

function imageOrigins(): string[] {
  // `data:` and `blob:` carry the collage background and any client-side
  // preview of an uploaded binder page before it is sent.
  const origins = ["'self'", "data:", "blob:"];
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabase) {
    try {
      origins.push(new URL(supabase).origin);
    } catch {
      // As above.
    }
  }
  return origins;
}

function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV !== "production";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],

    // 'unsafe-inline' is a deliberate, named weakening, not an oversight.
    // The App Router injects inline bootstrap and flight-data scripts on every
    // page. Removing it needs per-request nonces, which in turn needs every
    // page to render dynamically, and the public pages are static on purpose.
    // The upgrade path is a nonce issued in middleware; it is on the record as
    // an open item rather than done quietly and badly.
    "script-src": dev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'", "'unsafe-inline'"],

    // Tailwind and a handful of inline style attributes.
    "style-src": ["'self'", "'unsafe-inline'"],

    "img-src": imageOrigins(),
    "font-src": ["'self'", "data:"],
    "connect-src": connectOrigins(),

    // Nothing is embedded and nothing embeds us.
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],

    // Forms post to this origin only. Stripe checkout is a redirect, not a
    // cross-origin form post, so it does not need listing here.
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };

  const policy = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  return dev ? policy : `${policy}; upgrade-insecure-requests`;
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  // Two years, subdomains included, and eligible for preloading.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Redundant alongside frame-ancestors, kept for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Do not tell the world which framework and version to look up CVEs for.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
