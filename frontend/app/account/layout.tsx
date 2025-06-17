import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AkashChat API | Account',
  description: 'Manage your AkashChat API account, view and manage your API keys.',
  openGraph: {
    title: 'AkashChat API | Account',
    description: 'Manage your AkashChat API account, view and manage your API keys.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AkashChat API | Account',
    description: 'Manage your AkashChat API account, view and manage your API keys.',
  }
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 