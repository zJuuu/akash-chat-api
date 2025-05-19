import { LoaderIcon } from 'lucide-react'
import { FormEvent, FormEventHandler, useEffect, useState } from 'react'
import { ory, getUserName } from '@/lib/ory'

export default function GetKey({ handleSubmit }: { handleSubmit: (event: FormEvent) => Promise<boolean | undefined> }) {
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasNewsletterConsent, setHasNewsletterConsent] = useState(false);

    useEffect(() => {
        // Check if user is authenticated and get their info
        ory.toSession()
            .then(({ data }) => {
                console.log(data);
                setUserEmail(data.identity?.traits.email || '');
                setUserName(getUserName(data.identity));
                setIsLoggedIn(true);
                // Check if user already has email consent in their traits
                setHasNewsletterConsent(data.identity?.traits.newsletter === true);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, []);

    const localHandleSubmit: FormEventHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (!await handleSubmit(event)) {
            setLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center mt-6 md:mt-18">
                <LoaderIcon className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center mt-6 md:mt-18">
            <form onSubmit={localHandleSubmit} className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Generate your AkashChat API key</h1>
                {isLoggedIn && (
                    <div className="p-4 bg-blue-50 rounded-md">
                        <p className="font-medium">Logged in as: {userName}</p>
                        <p className="text-sm text-gray-600">Email: {userEmail}</p>
                    </div>
                )}

                {!isLoggedIn && (
                    <>
                        <p className="text-sm text-gray-500">
                            Please enter your information below.
                        </p>
                        <label htmlFor="name" className="text-sm font-semibold text-black">
                            Name
                        </label>
                        <input
                            name='name'
                            type="text"
                            placeholder="Name"
                            className="p-2 border border-gray-300 rounded-md"
                            required
                        />
                        <label htmlFor="email" className="text-sm font-semibold text-black">
                            Email
                        </label>
                        <input
                            name='email'
                            type="email"
                            placeholder="Email"
                            className="p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </>
                )}

                {isLoggedIn && (
                    <input
                        type="hidden"
                        name="name"
                        value={userName}
                    />
                )}

                {isLoggedIn && (
                    <input
                        type="hidden"
                        name="email"
                        value={userEmail}
                    />
                )}

                <label htmlFor="description" className="text-sm font-semibold text-black">
                    Description (optional)
                </label>
                <textarea
                    name='description'
                    placeholder="How do you plan to use this service?"
                    className="p-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        name='tos'
                        required
                        onClick={(e) => {
                            const target = e.target as HTMLInputElement
                            target.setCustomValidity("")
                        }}
                        onInvalid={(e) => {
                            const target = e.target as HTMLInputElement
                            target.setCustomValidity("Please agree to the Llama 3.1 & 3.2 Community License.")
                        }}
                    />
                    <p className="text-sm text-gray-500">
                        I agree to the <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.1</a></u>, <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>Llama 3.2</a></u>, and <u><a href="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8/blob/main/LICENSE" target='_blank'>Llama 4</a></u> Community Licenses and consent to receiving communications from Akash.
                    </p>
                </div>
                <div className={`flex items-center mt-2 ${hasNewsletterConsent ? 'hidden' : ''}`}>
                    <input
                        type="checkbox"
                        id="newsletterConsent"
                        name="newsletter_consent"
                        className="mr-2"
                        defaultChecked={hasNewsletterConsent}
                        required
                    />
                    <label htmlFor="newsletterConsent" className="text-sm text-gray-500">
                        I agree to receive marketing emails and updates from Akash Network.
                    </label>
                </div>
                <button
                    type="submit"
                    className="p-2 bg-black text-white rounded-md hover:bg-white hover:text-black hover:border-black border border-black"
                >
                    {loading ? <LoaderIcon className="w-6 h-6 justify-center mx-auto" /> : "GENERATE API KEY"}
                </button>
            </form>
        </div>
    )
}