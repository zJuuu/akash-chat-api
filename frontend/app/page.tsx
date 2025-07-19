"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormEvent, useState, useEffect } from "react"
import GetKey from "../components/get-key"
import z from 'zod'
import { Input } from "@/components/ui/input"
import { CheckCircle2, CopyCheck, CopyIcon, ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import CopyToClipboard from "react-copy-to-clipboard"
import { useAppUser } from "@/components/providers/UserProvider"

const schema = z.object({
  name: z.string().optional().nullable(),
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { isAuthenticated, isLoading, user, checkAuth } = useAppUser();

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  async function handleSubmit(e: FormEvent): Promise<boolean | undefined> {
    e.preventDefault()

    if (step === 1) {
      // Check if this is from Auth0 flow with a temporary API key
      const tempApiKey = (window as any).tempApiKey;
      if (tempApiKey) {
        setApiKey(tempApiKey);
        setStep(2);
        // Clean up the temporary key
        delete (window as any).tempApiKey;
        return true;
      }

      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string || null;
      const email = formData.get('email') as string;
      const description = formData.get('description') as string;
      const authType = formData.get('authType') as string || 'non-auth0';
      const tosCheckbox = (e.target as HTMLFormElement).querySelector('input[name="tos"]') as HTMLInputElement;
      const emailConsentCheckbox = (e.target as HTMLFormElement).querySelector('input[name="email-consent"]') as HTMLInputElement;
      const tos = tosCheckbox.checked;
      const emailConsent = emailConsentCheckbox.checked;


      if (!tos) {
        alert('Please accept the terms of service to continue.');
        return false;
      }

      if (!emailConsent) {
        alert('Please accept the communications consent to continue.');
        return false;
      }

      try {
        schema.parse({ name, description })
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          alert('Please enter a valid email address.');
          return false;
        }
      } catch (err: any) {
        alert(err.errors?.[0]?.message || 'Invalid form data');
        console.log(err.errors);
        return false;
      }

      const res = await fetch('/api/users/claim-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recaptcha-token': (e.target as HTMLFormElement).querySelector('[name="recaptcha-token"]')?.getAttribute('value') || '',
        },
        body: JSON.stringify({ 
          email, 
          name: name || 'Anonymous User', 
          description, 
          acceptToS: tos,
          acceptCommunications: emailConsent,
          authType
        }),
      })

      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apikey);
        if (data.sessionId) {
          setSessionId(data.sessionId);
          // Trigger immediate auth refresh to update the authentication state
          // This ensures the user is recognized as authenticated without requiring a page reload
          setTimeout(async () => {
            try {
              await checkAuth();
            } catch (error) {
              console.error('Failed to refresh auth state:', error);
            }
          }, 500); // Small delay to ensure the session cookie is properly set
        }
        setStep(2);
      } else {
        const errorData = await res.json();
        console.error('Failed to register:', errorData);
        alert(errorData.message || 'Failed to register. Please try again.');
        return false;
      }
    } else {
      return false;
    }
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    // Check if we should redirect to login after logout
    if (typeof window !== 'undefined') {
      const shouldRedirectToLogin = localStorage.getItem('redirectToLoginAfterLogout');
      if (shouldRedirectToLogin === 'true') {
        // Clear the flag
        localStorage.removeItem('redirectToLoginAfterLogout');
        // Redirect to Auth0 login with return to account page
        window.location.href = '/api/auth/login?returnTo=' + encodeURIComponent(window.location.origin + '/account');
      }
    }
  }, []);

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
                {isLoading ? (
                  <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 sm:px-8 text-sm font-medium text-muted-foreground shadow">
                    Loading...
                  </div>
                ) : isAuthenticated ? (
                  <Link
                    href="/account"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-akashred px-4 sm:px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {'Account'}
                  </Link>
                ) : (
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-akashred px-4 sm:px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                    onClick={() => setStep(1)}
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  href="/documentation"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background text-foreground px-4 sm:px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
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
        <div className="container flex flex-col items-center justify-start py-2 md:py-4">
          <div className="w-full max-w-4xl">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 -ml-2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <GetKey handleSubmit={handleSubmit} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="container flex flex-col items-center justify-start py-2 md:py-4">
          <div className="w-full max-w-4xl min-h-[600px]">
            <div className="w-full max-w-lg 2xl:max-w-3xl mx-auto">
              <Card className="mt-4">
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
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Your API Key is:</p>
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
                      <p className="text-sm text-muted-foreground mt-2">Inactive API keys will be revoked after 30 days.</p>
                    </div>

                    {sessionId && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">Account Created Locally</p>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Your account has been created locally in your browser! You can now manage your API keys.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link href="/documentation" className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Documentation
                        </Button>
                      </Link>
                      <Link href="/account" className="flex-1">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          <User className="w-4 h-4 mr-2" />
                          Manage Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
