import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.akash.network';
  const currentTime = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentTime,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/documentation`,
      lastModified: currentTime,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/account`,
      lastModified: currentTime,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}