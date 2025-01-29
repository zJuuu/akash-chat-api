"use client";

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import { Globe, ChartColumnIncreasing, ChartBarBig, Github, Copy, Check, ExternalLink, Book } from 'lucide-react';
import Code from '@/components/code';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);

const exampleCode = `import openai
import textwrap

client = openai.OpenAI(
    api_key="sk-xxxxxxxx",
    base_url=(
        "https://chatapi.akash.network"
        "/api/v1"
    )
)

response = client.chat.completions.create(
    model="Meta-Llama-3-1-8B-Instruct-FP8",
    messages=[
        {
            "role": "user",
            "content": "Who are you?"
        }
    ],
)

print(textwrap.fill(
    response.choices[0].message.content,
    50
))`;

const exampleCurl = `curl https://chatapi.akash.network/api/v1/\\
  chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-xxxxxxxx" \\
  -d '{
    "model": "Meta-Llama-3-1-8B-Instruct-FP8",
    "messages": [
      {
        "role": "user",
        "content": "Who are you?"
      }
    ]
  }' | python3 -c '
import json, sys
json.dump(
    json.load(sys.stdin),
    sys.stdout,
    indent=2
)
print()
'`;

const exampleAxios = `import axios from 'axios'

const client = axios.create({
  baseURL: 'https://chatapi.akash.network/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-xxxxxxxx'
  }
})

async function chat() {
  try {
    const response = await client.post(
      '/chat/completions',
      {
        model: "Meta-Llama-3-1-8B-Instruct-FP8",
        messages: [
          {
            role: "user",
            content: "Who are you?"
          }
        ]
      }
    )
    
    console.log(
      JSON.stringify(response.data, null, 2)
    )
  } catch (error) {
    console.error('Error:', error)
  }
}

chat()`;



export default function Documentation() {
  const [activeTab, setActiveTab] = useState<'python' | 'curl' | 'axios'>('python');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codeToCopy = activeTab === 'python' ? exampleCode : 
                      activeTab === 'axios' ? exampleAxios : 
                      exampleCurl;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Main content and sidebars */}
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-0 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left Sidebar */}
          <div className="hidden lg:block w-64 border-r border-gray-200">
            <div className="pr-5 lg:pr-8 space-y-4 sticky top-4">
              <div>
                <h3 className="text-gray-400 uppercase text-xs font-medium mb-2">Resources</h3>
                <nav className="space-y-1">
                  <Link href="https://chat.akash.network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <Globe className="w-4 h-4" />
                      <span>chat.akash.network</span>
                    </Button>
                  </Link>
                  <Link href="https://gen.akash.network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <Globe className="w-4 h-4" />
                      <span>gen.akash.network</span>
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="h-px bg-gray-100" aria-hidden="true" />

              <div>
                <nav className="space-y-2">
                  <Link href="https://stats.akash.network/" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <ChartColumnIncreasing className="w-3.5 h-3.5" />
                      <span>Akash Stats</span>
                    </Button>
                  </Link>
                  <Link href="https://akash.network/pricing/gpus" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <ChartBarBig className="w-3.5 h-3.5" />
                      <span>Price Compare</span>
                    </Button>
                  </Link>
                  <Link href="https://akash.network/docs" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <Book className="w-4 h-4" />
                      <span>Akash Docs</span>
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="h-px bg-gray-100" aria-hidden="true" />

              <div>
                <h3 className="text-gray-400 uppercase text-xs font-medium mb-2">Follow Akash</h3>
                <nav className="space-y-1">
                  <Link href="https://github.com/akash-network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <Github className="w-4 h-4" />
                      <span>Akash Github</span>
                    </Button>
                  </Link>
                  <Link href="https://twitter.com/akashnet_" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Akash on X</span>
                    </Button>
                  </Link>
                  <Link href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" color="currentColor" className="w-4 h-4">
                        <path d="M5.5 16C10.5 18.5 13.5 18.5 18.5 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.5 17.5L16.5 19.5C16.5 19.5 20.6713 18.1717 22 16C22 15 22.5301 7.85339 19 5.5C17.5 4.5 15 4 15 4L14 6H12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8.52832 17.5L7.52832 19.5C7.52832 19.5 3.35699 18.1717 2.02832 16C2.02832 15 1.49823 7.85339 5.02832 5.5C6.52832 4.5 9.02832 4 9.02832 4L10.0283 6H12.0283" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8.5 14C7.67157 14 7 13.1046 7 12C7 10.8954 7.67157 10 8.5 10C9.32843 10 10 10.8954 10 12C10 13.1046 9.32843 14 8.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.5 14C14.6716 14 14 13.1046 14 12C14 10.8954 14.6716 10 15.5 10C16.3284 10 17 10.8954 17 12C17 13.1046 16.3284 14 15.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Akash Discord</span>
                    </Button>
                  </Link>
                  <Link href="https://www.youtube.com/@AkashNetwork" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    >
                      <svg width="1.5em" height="1.5em" stroke-width="1.5" viewBox="0 0 24 24" fill="none" color="currentColor" className="w-4 h-4">
                        <path d="M14 12L10.5 14V10L14 12Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12.7075V11.2924C2 8.39705 2 6.94939 2.90549 6.01792C3.81099 5.08645 5.23656 5.04613 8.08769 4.96549C9.43873 4.92728 10.8188 4.8999 12 4.8999C13.1812 4.8999 14.5613 4.92728 15.9123 4.96549C18.7634 5.04613 20.189 5.08645 21.0945 6.01792C22 6.94939 22 8.39705 22 11.2924V12.7075C22 15.6028 22 17.0505 21.0945 17.9819C20.189 18.9134 18.7635 18.9537 15.9124 19.0344C14.5613 19.0726 13.1812 19.1 12 19.1C10.8188 19.1 9.43867 19.0726 8.0876 19.0344C5.23651 18.9537 3.81097 18.9134 2.90548 17.9819C2 17.0505 2 15.6028 2 12.7075Z" stroke="currentColor" />
                      </svg>
                      <span>Akash Youtube</span>
                    </Button>
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-gray max-w-none">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
                Getting Started
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-8">
                Using the AkashChat API
              </h2>
            </div>

            <section className="mt-8 sm:mt-12">
              <p className="text-gray-600 mb-6">
                The AkashChat API provides a simple interface to access the leading open-source AI models powered by the Akash Supercloud.
              </p>
              <p className="text-gray-600 mb-6">
                Akash is a permissionless marketplace for cloud resources with competitive pricing compared to traditional cloud providers.
              </p>
              <p className="text-gray-600 mb-6">
                It's easy to get started, as the Akash Chat API is compatible with the OpenAI API standard. If you're already running on the OpenAI API, it's simple to make the switch. If you're just getting started, see the examples below for interacting with the API.
              </p>
              <p className="text-gray-600 mb-8">
                If you need any support, the Akash community is available around the clock to help. For immediate support, please reach out on Discord. For larger issues or feature requests, feel free to start a Discussion on GitHub.
              </p>
            </section>

            <section className="mb-8 sm:mb-12">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://github.com/orgs/akash-network/discussions" target="_blank" rel="noopener noreferrer">
                  <button
                    className="inline-flex items-center justify-center font-medium gap-x-1.5 not-prose border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white shadow-sm px-2.5 py-1.5 lg:px-3 lg:py-2 text-sm rounded-md w-full"
                  >
                    <Github className="w-3.5 h-3.5" />
                    GitHub Discussions
                  </button>
                </Link>
                <Link href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer">
                  <button
                    className="inline-flex items-center justify-center font-medium gap-x-1.5 not-prose border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white shadow-sm px-2.5 py-1.5 lg:px-3 lg:py-2 text-sm rounded-md w-full"
                  >
                    <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" color="currentColor" className="w-3.5 h-3.5">
                      <path d="M5.5 16C10.5 18.5 13.5 18.5 18.5 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 17.5L16.5 19.5C16.5 19.5 20.6713 18.1717 22 16C22 15 22.5301 7.85339 19 5.5C17.5 4.5 15 4 15 4L14 6H12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.52832 17.5L7.52832 19.5C7.52832 19.5 3.35699 18.1717 2.02832 16C2.02832 15 1.49823 7.85339 5.02832 5.5C6.52832 4.5 9.02832 4 9.02832 4L10.0283 6H12.0283" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 14C7.67157 14 7 13.1046 7 12C7 10.8954 7.67157 10 8.5 10C9.32843 10 10 10.8954 10 12C10 13.1046 9.32843 14 8.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 14C14.6716 14 14 13.1046 14 12C14 10.8954 14.6716 10 15.5 10C16.3284 10 17 10.8954 17 12C17 13.1046 16.3284 14 15.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Akash Discord
                  </button>
                </Link>
              </div>
            </section>

            <section id="examples" className="mb-8 sm:mb-12">
              <h2 className="text-xl font-medium mb-4">Examples</h2>
              <div className="bg-[#18181B] rounded-lg overflow-hidden -mx-2 xs:-mx-4 sm:mx-0">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-800">
                  <div className="flex flex-wrap">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('python')}
                      className={`rounded-none h-8 px-2 xs:px-3 sm:px-4 text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                        activeTab === 'python'
                          ? 'text-white bg-gray-800 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      Python & OpenAI
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('axios')}
                      className={`rounded-none h-8 px-2 xs:px-3 sm:px-4 text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                        activeTab === 'axios'
                          ? 'text-white bg-gray-800 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      JavaScript
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('curl')}
                      className={`rounded-none h-8 px-2 xs:px-3 sm:px-4 text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                        activeTab === 'curl'
                          ? 'text-white bg-gray-800 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      Curl
                    </Button>
                  </div>
                  <div className="flex items-center px-2 xs:px-3 sm:px-4">
                    <Button
                      variant="ghost"
                      onClick={handleCopy}
                      className="rounded-none h-8 text-xs sm:text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 relative group min-w-[70px]"
                    >
                      {copied ? (
                        <div className="flex items-center justify-center w-full">
                          <Check className="w-4 h-4 text-green-400 transition-transform duration-200 ease-spring scale-125" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[300px]">
                    {activeTab === 'python' && (
                      <Code code={exampleCode}  />
                    )}
                    {activeTab === 'axios' && (
                      <Code code={exampleAxios}/>
                    )}
                    {activeTab === 'curl' && (
                      <Code code={exampleCurl}/>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section id="models" className="mt-8 sm:mt-12 -mx-2 xs:-mx-4 sm:mx-0">
              <h2 className="text-xl font-medium mb-4 px-2 xs:px-4 sm:px-0">Available Models</h2>
              <div className="bg-white rounded-lg divide-y divide-gray-100 overflow-hidden">
                {[
                  {model: "DeepSeek-R1", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1"},
                  {model: "DeepSeek-R1-Distill-Llama-70B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B"},
                  {model: "DeepSeek-R1-Distill-Llama-8B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B"},
                  {model: "DeepSeek-R1-Distill-Qwen-1.5B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"},
                  {model: "DeepSeek-R1-Distill-Qwen-14B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"},
                  {model: "DeepSeek-R1-Distill-Qwen-32B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"},
                  {model: "DeepSeek-R1-Distill-Qwen-7B", href: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"},
                  {model: "Meta-Llama-3-1-8B-Instruct-FP8", href: "https://huggingface.co/neuralmagic/Meta-Llama-3.1-8B-Instruct-FP8"},
                  {model: "Meta-Llama-3-1-405B-Instruct-FP8", href: "https://huggingface.co/neuralmagic/Meta-Llama-3.1-405B-Instruct-FP8"},
                  {model: "Meta-Llama-3-2-3B-Instruct", href: "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct"},
                  {model: "nvidia-Llama-3-1-Nemotron-70B-Instruct-HF", href: "https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct"},
                  {model: "Meta-Llama-3-3-70B-Instruct", href: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct"},
                ].map((model) => (
                  <div key={model.model} className="p-3 xs:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs xs:text-sm font-mono text-gray-800 break-all">
                        {model.model}
                      </code>
                      <div className="flex gap-4 text-sm">
                        <Button
                          variant="ghost"
                          asChild
                          className="h-7 px-2 text-xs xs:text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-accent hover:text-accent-foreground"
                        >
                          <a 
                            href={model.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                            Model details
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h3 className="text-gray-400 uppercase text-xs font-medium mb-2">On this page</h3>
              <nav className="space-y-1">
                {[
                  { title: "Using the API", href: "#using-the-api" },
                  { title: "Examples", href: "#examples" },
                  { title: "Available Models", href: "#models" },
                ].map((item) => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm font-light hover:bg-accent hover:text-accent-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector(item.href);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>{item.title}</span>
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
