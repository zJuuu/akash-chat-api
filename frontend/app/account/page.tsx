"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, CopyCheck, RotateCcw, Key, User, Calendar, Clock, Plus, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CopyToClipboard from 'react-copy-to-clipboard';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppUser } from '@/components/providers/UserProvider';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { sitekey } from '@/components/get-key';

interface ApiKey {
  _id: string;
  keyId: string;
  keyPreview: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
  expiresAt?: string;
}

interface UserData {
  _id: string;
  name: string;
  description: string;
  authType: 'auth0' | 'non-auth0';
  createdAt: string;
  apiKeys: ApiKey[];
}

export default function AccountPage() {
  const { isAuthenticated, isLoading: authLoading, error: authError, checkAuth } = useAppUser();
  const { user: auth0User } = useUser();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null);
  const [showNewKeyRecaptcha, setShowNewKeyRecaptcha] = useState(false);
  const [newKeyRecaptchaValue, setNewKeyRecaptchaValue] = useState<string | null>(null);
  const [showConfirmRecreate, setShowConfirmRecreate] = useState(false);
  const [keyToRecreate, setKeyToRecreate] = useState<{keyId: string, keyName: string} | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [missingConsent, setMissingConsent] = useState<string[]>([]);
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [communicationsAccepted, setCommunicationsAccepted] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const newKeyRecaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchUserData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchUserData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/account/me', {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // Session expired, trigger auth check
        await checkAuth();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndLogin = async () => {
    window.location.href = '/api/auth/logout';
    localStorage.setItem('redirectToLoginAfterLogout', 'true');
  };


  const handleRecreateKey = async (keyId: string, keyName: string) => {
    // Show confirmation modal first
    setKeyToRecreate({ keyId, keyName });
    setShowConfirmRecreate(true);
  };

  const handleConfirmRecreate = () => {
    if (!keyToRecreate) return;
    
    // Close confirmation modal and show reCAPTCHA
    setShowConfirmRecreate(false);
    setRegeneratingKeyId(keyToRecreate.keyId);
    setShowRecaptcha(true);
  };

  const performKeyRegeneration = async (keyId: string, keyName: string, recaptchaToken: string | null) => {
    if (!recaptchaToken) {
      alert('reCAPTCHA verification is required');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-recaptcha-token': recaptchaToken, // Always include reCAPTCHA token
      };

      const response = await fetch('/api/users/regenerate-key', {
        method: 'POST',
        headers,
        body: JSON.stringify({ keyId, keyName }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.missingConsent) {
          // Handle consent validation error
          handleConsentError(errorData);
          return;
        }
        throw new Error(errorData.message || 'Failed to regenerate API key');
      }

      const data = await response.json();
      setNewlyGeneratedKey(data.apikey);
      setShowNewKeyModal(true);
      await fetchUserData();
      
      // Reset reCAPTCHA state
      setShowRecaptcha(false);
      setRegeneratingKeyId(null);
      setRecaptchaValue(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (err) {
      console.error('Error recreating key:', err);
      alert(err instanceof Error ? err.message : 'Failed to recreate key');
      
      // Reset reCAPTCHA state on error
      setShowRecaptcha(false);
      setRegeneratingKeyId(null);
      setRecaptchaValue(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  };

  const handleRecaptchaSubmit = () => {
    if (!recaptchaValue) {
      alert('Please complete the reCAPTCHA verification');
      return;
    }

    if (!regeneratingKeyId) {
      alert('Invalid regeneration request');
      return;
    }

    const keyToRegenerate = user?.apiKeys.find(key => key.keyId === regeneratingKeyId);
    if (!keyToRegenerate) {
      alert('API key not found');
      return;
    }

    performKeyRegeneration(regeneratingKeyId, keyToRegenerate.name, recaptchaValue);
  };

  const handleCopy = (keyId: string) => {
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConsentError = (errorData: any) => {
    if (errorData.missingConsent) {
      setMissingConsent(errorData.missingConsent);
      setConsentError(errorData.message);
      setShowConsentModal(true);
      // Reset both consents - user needs to accept both if any are missing
      setTosAccepted(false);
      setCommunicationsAccepted(false);
    } else {
      alert(errorData.message || 'An error occurred');
    }
  };

  const handleConsentUpdate = async () => {
    // Both consents must be accepted
    if (!tosAccepted || !communicationsAccepted) {
      alert('Please accept both Terms of Service and Communications consent to continue.');
      return;
    }

    setUpdatingConsent(true);
    try {
      // Always send both consents
      const updateData = {
        acceptedToS: tosAccepted,
        acceptedCommunications: communicationsAccepted
      };

      const response = await fetch('/api/users/update-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update consent');
      }

      // Close modal and refresh user data
      setShowConsentModal(false);
      setConsentError(null);
      setMissingConsent([]);
      await fetchUserData();
      
    } catch (err) {
      console.error('Error updating consent:', err);
      alert(err instanceof Error ? err.message : 'Failed to update consent');
    } finally {
      setUpdatingConsent(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateNewKey = async () => {
    // Check if user already has an active key
    const activeKeys = user?.apiKeys.filter(key => key.isActive) || [];
    if (activeKeys.length > 0) {
      alert('You already have an active API key. Please recreate your existing key instead.');
      return;
    }

    // Show reCAPTCHA for verification directly without showing the modal first
    setShowNewKeyRecaptcha(true);
  };

  const performNewKeyGeneration = async () => {
    if (!newKeyRecaptchaValue) {
      alert('Please complete the reCAPTCHA verification');
      return;
    }

    setGeneratingKey(true);
    try {
      const response = await fetch('/api/users/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recaptcha-token': newKeyRecaptchaValue,
        },
        body: JSON.stringify({ name: 'API Key' }), // Use default name
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.missingConsent) {
          // Handle consent validation error
          handleConsentError(errorData);
          return;
        }
        throw new Error(errorData.message || 'Failed to generate API key');
      }

      const data = await response.json();
      setNewlyGeneratedKey(data.apikey);
      setShowNewKeyModal(true);
      await fetchUserData();
      
      // Reset reCAPTCHA state
      setShowNewKeyRecaptcha(false);
      setNewKeyRecaptchaValue(null);
      if (newKeyRecaptchaRef.current) {
        newKeyRecaptchaRef.current.reset();
      }
    } catch (err) {
      console.error('Error generating API key:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate API key');
      
      // Reset reCAPTCHA state on error
      setShowNewKeyRecaptcha(false);
      setNewKeyRecaptchaValue(null);
      if (newKeyRecaptchaRef.current) {
        newKeyRecaptchaRef.current.reset();
      }
    } finally {
      setGeneratingKey(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your account..." />
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error: {authError || error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to access your account</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Dashboard</h1>
          <p className="text-muted-foreground">Manage your AkashChat API account and API keys</p>
        </div>

        {/* Account Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-foreground">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <Badge variant={user.authType === 'auth0' ? 'default' : 'secondary'}>
                    {user.authType === 'auth0' ? 'Extended Access' : 'Permissionless'}
                  </Badge>
                </div>
              </div>
            </div>
            {user.description && user.description !== 'No description provided' && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-foreground">{user.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Verification Warning for Auth0 Users */}
        {user.authType === 'auth0' && auth0User && auth0User.email_verified === false && (
          <Card className="mb-8 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5" />
                Email Verification Required
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                Verify your email address to enable API key management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-amber-200 rounded-lg dark:border-amber-900">
                  <p className="text-sm text-amber-800 mb-3 dark:text-amber-200">
                    To ensure account security, please verify your email address before creating API keys.
                  </p>
                  <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside mb-4 dark:text-amber-300">
                    <li>Check your inbox for a verification email from Auth0</li>
                    <li>Click the verification link to confirm your email address</li>
                    <li>Use the button below to refresh your session</li>
                  </ol>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleLogoutAndLogin}
                    variant="default"
                    className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-800 dark:hover:bg-amber-900"
                  >
                    Refresh Session
                  </Button>
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Use after completing email verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for accessing the AkashChat API
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user.apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No API keys found</p>
                <Button 
                  onClick={handleGenerateNewKey}
                  disabled={user.authType === 'auth0' && auth0User && auth0User.email_verified === false}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Your First API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {user.apiKeys.filter(key => key.isActive).length > 0 && (
                  <div className="p-4 bg-muted border border-border rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-akashred" />
                      <p className="text-sm font-medium text-foreground">One API Key Policy</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You currently have an active API key. To generate a new key, please recreate your existing key.
                    </p>
                  </div>
                )}
                {user.apiKeys.map((apiKey) => (
                  <div key={apiKey._id} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">                         
                        <div className="flex items-center gap-2 mb-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {apiKey.keyPreview}
                          </code>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDate(apiKey.createdAt)}
                          </span>
                          {apiKey.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {formatDate(apiKey.expiresAt)}
                            </span>
                          )}
                          {apiKey.lastUsed && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last used {formatDate(apiKey.lastUsed)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {apiKey.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecreateKey(apiKey.keyId, apiKey.name)}
                            disabled={user.authType === 'auth0' && auth0User && auth0User.email_verified === false}
                            title={user.authType === 'auth0' && auth0User && auth0User.email_verified === false ? "Please verify your email address first" : "Recreate API Key"}
                            className="text-akashred hover:text-akashred/80 hover:bg-accent border-border disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Recreate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Need help? Check out our{' '}
            <Link href="/documentation" className="text-akashred hover:underline">
              documentation
            </Link>{' '}
            or reach out on{' '}
            <a href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer" className="text-akashred hover:underline">
              Discord
            </a>
          </p>
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Generate New API Key</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewKeyModal(false);
                  setNewlyGeneratedKey(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {!newlyGeneratedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-akashred" />
                    <p className="text-sm font-medium text-foreground">Ready to Generate API Key</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to proceed with generating your new API key.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateNewKey}
                    disabled={generatingKey}
                    className="flex-1"
                  >
                    {generatingKey ? 'Generating...' : 'Continue to Verification'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewKeyModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">API Key Generated!</p>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Your new API key has been generated. Make sure to copy it now as you won't be able to see it again.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your New API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newlyGeneratedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <CopyToClipboard
                      onCopy={() => handleCopy('new-key')}
                      text={newlyGeneratedKey}
                    >
                      <Button size="sm" variant="outline">
                        {copiedKey === 'new-key' ? (
                          <CopyCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </CopyToClipboard>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setNewlyGeneratedKey(null);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* reCAPTCHA Modal for Key Regeneration */}
      {showRecaptcha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Security Verification</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRecaptcha(false);
                  setRegeneratingKeyId(null);
                  setRecaptchaValue(null);
                  if (recaptchaRef.current) {
                    recaptchaRef.current.reset();
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-4 h-4 text-akashred" />
                  <p className="text-sm font-medium text-foreground">Recreate API Key</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please complete the security verification to recreate your API key.
                </p>
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={sitekey}
                  onChange={(value: string | null) => setRecaptchaValue(value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRecaptchaSubmit}
                  disabled={!recaptchaValue}
                  className="flex-1"
                >
                  Recreate API Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRecaptcha(false);
                    setRegeneratingKeyId(null);
                    setRecaptchaValue(null);
                    if (recaptchaRef.current) {
                      recaptchaRef.current.reset();
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* reCAPTCHA Modal for New Key Generation */}
      {showNewKeyRecaptcha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Security Verification</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewKeyRecaptcha(false);
                  setNewKeyRecaptchaValue(null);
                  if (newKeyRecaptchaRef.current) {
                    newKeyRecaptchaRef.current.reset();
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Generate New API Key</p>
                </div>
                <p className="text-sm text-green-700">
                  Please complete the security verification to generate your new API key.
                </p>
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={newKeyRecaptchaRef}
                  sitekey={sitekey}
                  onChange={(value: string | null) => setNewKeyRecaptchaValue(value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={performNewKeyGeneration}
                  disabled={!newKeyRecaptchaValue || generatingKey}
                  className="flex-1"
                >
                  {generatingKey ? 'Generating...' : 'Generate API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewKeyRecaptcha(false);
                    setNewKeyRecaptchaValue(null);
                    if (newKeyRecaptchaRef.current) {
                      newKeyRecaptchaRef.current.reset();
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for API Key Recreation */}
      {showConfirmRecreate && keyToRecreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Confirm API Key Recreation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowConfirmRecreate(false);
                  setKeyToRecreate(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">Important Notice</p>
                </div>
                <p className="text-sm text-amber-700">
                  Are you sure you want to recreate this API key? The old key will be deactivated immediately and a new one will be generated.
                </p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">API Key to recreate:</p>
                <code className="text-sm font-mono text-foreground">
                  {user?.apiKeys.find(key => key.keyId === keyToRecreate.keyId)?.keyPreview}
                </code>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmRecreate}
                  variant="destructive"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Yes, Recreate Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmRecreate(false);
                    setKeyToRecreate(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Update Consent Required</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowConsentModal(false);
                  setConsentError(null);
                  setMissingConsent([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  To continue with this action, you need to accept the following consent(s):
                </p>
                <ul className="text-xs text-yellow-700 list-disc list-inside">
                  {missingConsent.map((consent, index) => (
                    <li key={index}>{consent}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="consent-tos"
                    className="mt-1 h-4 w-4 text-foreground focus:ring-ring border-border rounded"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                  />
                  <label htmlFor="consent-tos" className="text-sm text-foreground">
                    I agree to the <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank' className="text-blue-600 hover:text-blue-800">Llama 3.1</a></u>, <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank' className="text-blue-600 hover:text-blue-800">Llama 3.2</a></u>, and <u><a href="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8/blob/main/LICENSE" target='_blank' className="text-blue-600 hover:text-blue-800">Llama 4</a></u> Community Licenses. *
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="consent-communications"
                    className="mt-1 h-4 w-4 text-foreground focus:ring-ring border-border rounded"
                    checked={communicationsAccepted}
                    onChange={(e) => setCommunicationsAccepted(e.target.checked)}
                  />
                  <label htmlFor="consent-communications" className="text-sm text-foreground">
                    I agree to receive communications from Akash regarding service updates, security notices, API changes, marketing materials, and other commercial information. *
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConsentUpdate}
                  disabled={updatingConsent || !tosAccepted || !communicationsAccepted}
                  className="flex-1"
                >
                  {updatingConsent ? 'Updating...' : 'Update Consent'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConsentModal(false);
                    setConsentError(null);
                    setMissingConsent([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 