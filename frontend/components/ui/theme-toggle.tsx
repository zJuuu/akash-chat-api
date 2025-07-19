'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  variant?: 'default' | 'footer'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    if (variant === 'footer') {
      return (
        <button className="hover:underline" aria-label="Toggle theme">
          <Sun className="h-5 w-5 text-zinc-400 hover:text-white transition-colors" />
        </button>
      )
    }
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    const iconClass = variant === 'footer' 
      ? "h-5 w-5 text-zinc-400 hover:text-white transition-colors" 
      : "h-[1.2rem] w-[1.2rem] transition-all"
    
    switch (theme) {
      case 'light':
        return <Sun className={iconClass} />
      case 'dark':
        return <Moon className={iconClass} />
      case 'system':
        return <Monitor className={iconClass} />
      default:
        return <Sun className={iconClass} />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system mode'
      case 'system':
        return 'Switch to light mode'
      default:
        return 'Toggle theme'
    }
  }

  if (variant === 'footer') {
    return (
      <button className="hover:underline" onClick={cycleTheme} aria-label={getLabel()}>
        {getIcon()}
      </button>
    )
  }

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme}>
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}