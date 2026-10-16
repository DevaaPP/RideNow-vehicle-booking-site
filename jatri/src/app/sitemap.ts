import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 86400; // 24 hours

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ride-now-vehicle-booking-site.vercel.app";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/book", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/fleet", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/safety", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/cookies", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/payment-terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/partner-terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/cancellation-refund", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/grievance", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
