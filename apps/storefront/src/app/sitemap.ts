import { MetadataRoute } from "next"
import { listServerModels } from "@lib/server-configurator/data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
  const models = await listServerModels()
  return [
    { url: `${baseUrl}/servers`, changeFrequency: "daily", priority: 0.9 },
    ...models.map((model) => ({
      url: `${baseUrl}/servers/${model.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
