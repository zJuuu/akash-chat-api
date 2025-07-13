import { LoaderIcon } from 'lucide-react'
import { FormEvent, FormEventHandler, useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import ReCAPTCHA from 'react-google-recaptcha'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export default function GetKey({ handleSubmit }: { handleSubmit: (event: FormEvent) => Promise<boolean | undefined> }) {
    const [loading, setLoading] = useState(false);
    const { user, isLoading, error } = useUser();
    const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
    const [tosAccepted, setTosAccepted] = useState(false);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [refreshingSession, setRefreshingSession] = useState(false);

    useEffect(() => {
        if (user) {
            setIsVerifyingEmail(true);

            // Check if email is verified for Auth0 users
            if (user.email_verified === true) {
                setEmailVerified(true);
                setIsVerifyingEmail(false);
            } else {
                setEmailVerified(false);
                setIsVerifyingEmail(false);
            }
        }
    }, [user, isLoading, error]);

    const handleRefreshSession = async () => {
        if (refreshingSession) return; // Prevent multiple clicks
        
        setRefreshingSession(true);
        try {
            
            // Force a re-fetch of the user profile from Auth0
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            window.location.reload();
        } finally {
            setRefreshingSession(false);
        }
    };

    const handleAuth0Submit = async () => {
        if (!tosAccepted) {
            return;
        }

        if (!emailVerified) {
            console.error('Email not verified');
            alert('Please verify your email address before generating an API key. Check your email for a verification link from Auth0.');
            return;
        }

        setLoading(true);
        try {
            
            const checkResponse = await fetch('/api/account/me', {
                credentials: 'include'
            });
            
            if (checkResponse.ok) {
                const userData = await checkResponse.json();
                if (userData.apiKeys && userData.apiKeys.length > 0) {
                    window.location.href = '/account';
                    return;
                }
                
                // User exists but has no API keys, generate one
                const generateResponse = await fetch('/api/users/generate-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        name: `${user?.name || 'Auth0 User'} API Key`
                    }),
                    credentials: 'include',
                });

                if (generateResponse.ok) {
                    const data = await generateResponse.json();
                    // Store the API key temporarily for the main flow
                    (window as any).tempApiKey = data.apikey;
                    
                    // Trigger the main form submission flow
                    const form = document.createElement('form');
                    const syntheticEvent = {
                        preventDefault: () => {},
                        target: form
                    } as unknown as FormEvent;
                    
                    const success = await handleSubmit(syntheticEvent);
                    if (!success) {
                        setLoading(false);
                    }
                } else {
                    const errorData = await generateResponse.json();
                    if (generateResponse.status === 403 && errorData.missingConsent) {
                        // Handle consent validation error for Auth0 users
                        alert(`Missing required consent: ${errorData.missingConsent.join(', ')}. Please contact support or re-register to update your consent.`);
                        setLoading(false);
                        return;
                    }
                    throw new Error(errorData.message || 'Failed to generate API key');
                }
            } else {
                // User doesn't exist in LiteLLM yet, create them with API key
                const form = document.createElement('form');
                form.innerHTML = `
                    <input type="text" name="name" value="${user?.name || ''}" />
                    <input type="email" name="email" value="verified@auth0.user" />
                    <input type="text" name="description" value="Auth0 SSO User" />
                    <input type="checkbox" name="tos" checked />
                    <input type="checkbox" name="email-consent" checked />
                    <input type="text" name="authType" value="auth0" />
                `;

                const syntheticEvent = {
                    preventDefault: () => {},
                    target: form
                } as unknown as FormEvent;
                
                const success = await handleSubmit(syntheticEvent);
                if (!success) {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            alert('An error occurred while generating your API key. Please try again.');
            setLoading(false);
        }
    };

    const localHandleSubmit: FormEventHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        
        // Add reCAPTCHA token to form
        const form = event.target as HTMLFormElement;
        const recaptchaInput = document.createElement('input');
        recaptchaInput.type = 'hidden';
        recaptchaInput.name = 'recaptcha-token';
        recaptchaInput.value = recaptchaValue || '';
        form.appendChild(recaptchaInput);

        // Add authType to form
        const authTypeInput = document.createElement('input');
        authTypeInput.type = 'hidden';
        authTypeInput.name = 'authType';
        authTypeInput.value = 'non-auth0';
        form.appendChild(authTypeInput);

        if (!await handleSubmit(event)) {
            setLoading(false);
        }
    }

    if (isLoading || isVerifyingEmail) {
        return (
            <div className="flex flex-col items-center justify-center mt-6 md:mt-18">
                <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                    <LoaderIcon className="w-8 h-8 animate-spin" />
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold">Verifying your email...</h2>
                        <p className="text-sm text-gray-500">
                            Please wait while we verify your email address. This may take a few moments.
                        </p>
                        {isVerifyingEmail && !emailVerified && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-4">
                                <p className="text-sm text-blue-800">
                                    If you don't see your email verified, you may need to:
                                    <ul className="list-disc list-inside mt-2">
                                        <li>Ensure your GitHub email is verified</li>
                                        <li>Log out and log back in to grant email access</li>
                                        <li>Check your GitHub account settings</li>
                                    </ul>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (user && !tosAccepted) {
        return (
            <div className="flex justify-center items-center mt-6 md:mt-18">
                <div className="flex flex-col gap-4 w-full max-w-lg">
                    <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
                    <p className="text-sm text-gray-500">
                        Please review and accept the terms of service to generate your API key with enhanced privileges.
                    </p>
                    {!emailVerified && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800 mb-3">
                                Your email address needs to be verified before you can generate an API key.
                            </p>
                            <div className="space-y-2">
                                <p className="text-xs text-yellow-700">
                                    If you've already verified your email, click the button below to refresh your session:
                                </p>
                                <button
                                    onClick={handleRefreshSession}
                                    disabled={refreshingSession}
                                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {refreshingSession ? 'Refreshing...' : 'Refresh Session'}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={tosAccepted}
                            onChange={(e) => setTosAccepted(e.target.checked)}
                        />
                        <p className="text-sm text-gray-500">
                            I agree to the <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.1</a></u>, <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.2</a></u>, and <u><a href="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8/blob/main/LICENSE" target='_blank'>Llama 4</a></u> Community Licenses.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (user && tosAccepted) {
        return (
            <div className="flex justify-center items-center mt-6 md:mt-18">
                <div className="flex flex-col gap-4 w-full max-w-lg">
                    <h1 className="text-3xl font-bold">Ready to generate your API key</h1>
                    <p className="text-sm text-gray-500">
                        You've accepted the terms of service. Click the button below to generate your API key with enhanced privileges.
                    </p>
                    {!emailVerified && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800 mb-3">
                                Your email address needs to be verified before you can generate an API key.
                            </p>
                            <div className="space-y-2">
                                <p className="text-xs text-yellow-700">
                                    If you've already verified your email, click the button below to refresh your session:
                                </p>
                                <button
                                    onClick={handleRefreshSession}
                                    disabled={refreshingSession}
                                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {refreshingSession ? 'Refreshing...' : 'Refresh Session'}
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleAuth0Submit}
                        disabled={loading || !emailVerified}
                        className="p-2 bg-black text-white rounded-md hover:bg-white hover:text-black hover:border-black border border-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoaderIcon className="w-6 h-6 justify-center mx-auto" /> : "GENERATE API KEY"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center mt-2 md:mt-4">
            <form onSubmit={localHandleSubmit} className="flex flex-col gap-4 w-full max-w-lg">
                <h1 className="text-3xl font-bold">Generate Your AkashChat API Key</h1>
                <p className="text-sm text-gray-500">
                    Choose how you'd like to access the AkashChat API. Both options are completely free.
                </p>

                <Tabs defaultValue="non-auth0" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="non-auth0">Permissionless</TabsTrigger>
                        <TabsTrigger value="auth0">Extended</TabsTrigger>
                    </TabsList>

                    <TabsContent value="non-auth0" className="min-h-[600px]">
                        <div className="space-y-6">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h3 className="text-lg font-semibold mb-2 text-green-800">Permissionless Access</h3>
                                <p className="text-sm text-green-700 mb-2">
                                    Get started immediately with no signup required. Perfect for testing and small projects.
                                </p>
                                <ul className="text-sm text-green-600 space-y-1">
                                    <li>• Local account creation</li>
                                    <li>• Instant API key generation</li>
                                    <li>• 5-day validity period</li>
                                    <li>• Full access to all models</li>
                                </ul>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
                                    <input
                                        id="email"
                                        name='email'
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">How will you use the API? (Optional)</label>
                                    <textarea
                                        id="description"
                                        name='description'
                                        placeholder="e.g., Building a chatbot, research project, testing AI integration..."
                                        rows={3}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 resize-none"
                                    />
                                </div>

                                <div className="flex justify-center pt-2">
                                    <ReCAPTCHA
                                        sitekey={sitekey}
                                        onChange={(value: string | null) => setRecaptchaValue(value)}
                                    />
                                </div>

                                <div className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id="email-consent"
                                        name="email-consent"
                                        className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                        required
                                    />
                                    <label htmlFor="email-consent" className="text-sm text-gray-700">
                                        I agree to receive communications from Akash regarding service updates, security notices, API changes, marketing materials, and other commercial information. *
                                    </label>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id="tos-permissionless"
                                        className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                                        name='tos'
                                        required
                                    />
                                    <label htmlFor="tos-permissionless" className="text-sm text-gray-700">
                                        I agree to the <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.1</a></u>, <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.2</a></u>, and <u><a href="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8/blob/main/LICENSE" target='_blank'>Llama 4</a></u> Community Licenses. *
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full p-3 rounded-lg border border-black transition-all duration-200 font-medium flex items-center justify-center gap-2 ${
                                        loading || !recaptchaValue
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-black text-white hover:bg-white hover:text-black cursor-pointer"
                                    }`}
                                    disabled={loading || !recaptchaValue}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <LoaderIcon className="w-4 h-4 animate-spin" />
                                            Generating API Key...
                                        </div>
                                    ) : (
                                        "Generate API Key"
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                    * Required fields
                </p>
                    </TabsContent>

                    <TabsContent value="auth0" className="min-h-[600px]">
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-lg font-semibold mb-2 text-blue-800">Extended Access Benefits</h3>
                                <p className="text-sm text-blue-700 mb-2">
                                    Sign up for enhanced features and better account management.
                                </p>
                                <ul className="space-y-1 text-sm text-blue-600">
                                    <li>• Account dashboard with API key management</li>
                                    <li>• Future premium features</li>
                                </ul>
                            </div>

                                
                                <a
                                    href="/api/auth/login?returnTo=%2Faccount"
                                    className="w-full p-3 rounded-lg border border-black transition-all duration-200 flex items-center justify-center gap-2 font-medium bg-black text-white hover:bg-white hover:text-black cursor-pointer"
                                >
                                    Sign up with Extended Access
                                </a>
                                
                                <p className="text-xs text-gray-500 text-center">
                                    Sign up using GitHub, Google, or other supported providers.
                                </p>
                            </div>
                    </TabsContent>
                </Tabs>
            </form>
        </div>
    )
}