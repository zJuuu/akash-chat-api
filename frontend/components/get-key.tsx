import { LoaderIcon } from 'lucide-react'
import { FormEvent, FormEventHandler, useRef, useState } from 'react'

export default function GetKey({ handleSubmit }: { handleSubmit: (event: FormEvent) => Promise<boolean | undefined> }) {
    const [loading, setLoading] = useState(false);

    const localHandleSubmit: FormEventHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (!await handleSubmit(event)) {
            setLoading(false);
        }
    }

    return (
        <div className="flex justify-center items-center mt-6 md:mt-18">
            <form onSubmit={localHandleSubmit} className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Generate your AkashChat API key</h1>
                <p className="text-sm text-gray-500">
                    Please enter your name, email, and a brief description of how you plan to use the API below.
                </p>
                <label htmlFor="name" className="text-sm font-semibold text-black">
                    Name
                </label>
                <input
                    name='name'
                    type="text"
                    placeholder="Name"
                    className="p-2 border border-gray-300 rounded-md"
                />
                <label htmlFor="description" className="text-sm font-semibold text-black">
                    Email (optional)
                </label>
                <input
                    name='email'
                    type="email"
                    placeholder="Email"
                    className="p-2 border border-gray-300 rounded-md"
                />
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
                        I agree to the <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>LLaMA 3.1</a></u> & <u><a href="https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct/blob/main/LICENSE" target='_blank'>LLaMA 3.2 Community License</a></u>
                    </p>
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