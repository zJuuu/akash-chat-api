'use client'

import { AkashChatAPILogo } from './akash-chat-api-logo'

interface ThemeAwareLogoProps {
  className?: string
  alt?: string
}

export function ThemeAwareLogo({ className = "w-48" }: ThemeAwareLogoProps) {
  return <AkashChatAPILogo className={className} />
}