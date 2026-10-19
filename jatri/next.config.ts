import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

try {
  const publicJatriPng = path.join(process.cwd(), "public", "logojatri.png");
  const publicJatriWebp = path.join(process.cwd(), "public", "logojatri.webp");
  const destIconPng = path.join(process.cwd(), "src", "app", "icon.png");
  const destIconWebp = path.join(process.cwd(), "src", "app", "icon.webp");

  if (fs.existsSync(publicJatriPng)) {
    fs.copyFileSync(publicJatriPng, destIconPng);
  }
  if (fs.existsSync(publicJatriWebp)) {
    fs.copyFileSync(publicJatriWebp, destIconWebp);
  }
} catch (err) {
  console.error("Error setting up Jaatri favicon:", err);
}

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-XSS-Protection",
    value: "0",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self), payment=(self)",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.zegocloud.com https://*.zego.im; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.zegocloud.com; " +
      "img-src 'self' blob: data: https:; " +
      "connect-src 'self' https: wss: ws:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.zegocloud.com https://*.zego.im; " +
      "media-src 'self' blob: data: https://*.zegocloud.com https://*.zego.im; " +
      "base-uri 'self'; " +
      "form-action 'self' https://checkout.razorpay.com; " +
      "frame-ancestors 'self'; " +
      "object-src 'none';",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
