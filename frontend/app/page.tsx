"use client"

import { BookOpen, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function Index() {
  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    "name": "AkashChat API",
    "description": "Open and permissionless AI API powered by the Akash Supercloud providing access to leading open-source AI models like LLaMA and DeepSeek at zero cost.",
    "url": "https://api.akash.network",
    "provider": {
      "@type": "Organization",
      "name": "Akash Network",
      "url": "https://akash.network"
    },
    "documentation": "https://api.akash.network/documentation",
    "category": "AI/Machine Learning",
    "isAccessibleForFree": true,
    "potentialAction": {
      "@type": "ConsumeAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://api.akash.network/documentation",
        "actionPlatform": [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform"
        ]
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="w-full">
        <div className="container grid grid-cols-1 md:grid-cols-2 items-center gap-6 px-4 md:px-6 lg:gap-10">
          <div className="order-2 md:order-1 space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Build with the
              <br />
              AkashChat API
            </h1>
            <p className="max-w-[600px] text-lg md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Welcome to the AkashChat API, an open and permissionless LLaMA & DeepSeek API powered by the Akash Supercloud that anyone can access at completely zero-cost.
            </p>

            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="/documentation"
                className="inline-flex h-10 items-center justify-center rounded-md bg-akashred px-4 sm:px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                prefetch={false}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Documentation
              </Link>
              <Link
                href="https://akash.network"
                target="_blank"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background text-foreground px-4 sm:px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                prefetch={false}
              >
                Visit Akash Network
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src="/hero-graphic-akash-chat-api.svg"
              width="800"
              height="600"
              alt="Hero Image"
              className="mx-auto aspect-[4/3] overflow-hidden rounded-xl object-cover md:w-full w-auto"
            />
          </div>
        </div>
      </section>
    </>
  )
}
