import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AkashChat API | Documentation',
  description: 'Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.',
  openGraph: {
    title: 'AkashChat API | Documentation',
    description: 'Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AkashChat API | Documentation',
    description: 'Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.',
  }
}

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 