"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormEvent, useState, useEffect } from "react"
import GetKey from "../components/get-key"
import z from 'zod'
import { Input } from "@/components/ui/input"
import { CheckCircle2, CopyCheck, CopyIcon, ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"
import CopyToClipboard from "react-copy-to-clipboard"
import { useRouter } from "next/navigation"
import { ory } from "@/lib/ory"

const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})
const emailSchema = z.union([
  z.literal(''),
  z.string().email(),
])

export default function Index() {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isCopied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    ory
      .toSession()
      .then(() => {
        setIsAuthenticated(true);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setStep(1);
    } else {
      // Redirect to login if not authenticated
      router.push("/login?returnTo=/");
    }
  };

  async function handleSubmit(e: FormEvent): Promise<boolean | undefined> {
    e.preventDefault()

    if (step === 1) {
      const formData = new FormData(e.target as HTMLFormElement);
      const newsletterCheckbox = (e.target as HTMLFormElement).querySelector('input[name="newsletter_consent"]') as HTMLInputElement;
      const newsletter = newsletterCheckbox.checked;
      const description = formData.get('description') as string;
      const tosCheckbox = (e.target as HTMLFormElement).querySelector('input[name="tos"]') as HTMLInputElement;
      const tos = tosCheckbox.checked;

      if (!tos) {
        return;
      }

      const res = await fetch('/api/users/claim-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, acceptToS: tos, newsletter }),
      })

      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apikey);
        setStep(2);
      } else {
        if (res.status === 401) {
          // If authentication is required, redirect to login
          router.push("/login?returnTo=/");
          return false;
        }
        alert('Failed to register')
        console.error(await res.text())
        return false
      }
    } else {
      return false
    }
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {step === 0 && (
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
                <Button
                  className="inline-flex h-10 items-center justify-center rounded-md bg-akashred px-4 sm:px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  onClick={handleGetStarted}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Loading..."
                  ) : isAuthenticated ? (
                    "Get Started"
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in to continue
                    </>
                  )}
                </Button>
                <Link
                  href="/documentation"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-white px-4 sm:px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  AkashChat API Guide
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
      )}
      {step === 1 && (
        <div className="container flex flex-col items-center justify-center min-h-screen py-6 md:py-18">
          <div className="w-full max-w-lg">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 -ml-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <GetKey handleSubmit={handleSubmit} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="container flex flex-col items-center justify-center min-h-screen py-6">
          <div className="w-full max-w-lg 2xl:max-w-3xl">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 -ml-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-10 h-10 text-[#4BB543]" />
                    <span>Your API Key was generated successfully.</span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Please keep it safe and secure.
                  <br />
                  Learn how to get started with the <u><Link target="_blank" href="/documentation">AkashChat API guide</Link></u>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">Your API Key is:</p>
                  <div className="flex items-center space-x-2">
                    <Input type="text" value={apiKey} readOnly className="pr-10" />
                    <CopyToClipboard
                      onCopy={handleCopy}
                      text={apiKey}
                    >
                      <Button onClick={handleCopy} variant="ghost" size="icon" aria-label="Copy to Clipboard Button" className="right-2">
                        {isCopied ? <CopyCheck className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </CopyToClipboard>
                  </div>
                  <p className="text-sm text-muted-foreground">Inactive API keys will be revoked after 30 days.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
