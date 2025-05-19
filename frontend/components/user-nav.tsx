"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ory, getUserName } from "@/lib/ory"
import { User, LogOut } from "lucide-react"
import { Session } from "@ory/client"

export function UserNav() {
  const [session, setSession] = useState<Session | null>(null)
  const [logoutUrl, setLogoutUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for user session
    ory
      .toSession()
      .then(({ data }) => {
        setSession(data)
        setLoading(false)
        
        // Create a logout URL
        ory.createBrowserLogoutFlow().then(({ data }) => {
          setLogoutUrl(data.logout_url)
        })
      })
      .catch(() => {
        setSession(null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return null
  }

  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline" className="rounded-full">
          <User className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard">
        <Button variant="outline" className="rounded-full">
          <User className="mr-2 h-4 w-4" />
          {getUserName(session.identity)}
        </Button>
      </Link>
      {logoutUrl && (
        <a href={logoutUrl}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </a>
      )}
    </div>
  )
} 