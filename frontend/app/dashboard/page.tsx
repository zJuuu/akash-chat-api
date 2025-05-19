"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ory, getUserName, baseUrl } from "@/lib/ory"
import { Session } from "@ory/client"

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<Session | undefined>()
  const [logoutUrl, setLogoutUrl] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if the user has a session
    ory
      .toSession()
      .then(({ data }) => {
        // User has a session!
        setSession(data)
        setLoading(false)
        
        // Create a logout URL
        ory.createBrowserLogoutFlow().then(({ data }) => {
          setLogoutUrl(data.logout_url)
        })
      })
      .catch(() => {
        // User is not logged in, redirect to login
        setLoading(false)
        router.push("/login")
      })
  }, [router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-6 p-6">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null // This shouldn't render as we redirect in the useEffect
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl gap-6 p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl">Welcome, {getUserName(session.identity)}!</p>
        <p className="text-base">You are now logged in.</p>
        {logoutUrl && (
          <a 
            href={logoutUrl}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Logout
          </a>
        )}
      </div>
    </div>
  )
} 