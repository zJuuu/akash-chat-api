"use client";

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import Code from '@/components/code';
import customStyle from '@/lib/codestyle';
import { useState } from 'react';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);

const exampleCode = `import openai
import textwrap
client = openai.OpenAI(
    api_key="sk-xxxxxxxx",
    base_url="https://chatapi.akash.network/api/v1"
)

response = client.chat.completions.create(
    model="Meta-Llama-3-1-8B-Instruct-FP8",
    messages = [
        {
            "role": "user",
            "content": "Who are you?"
        }
    ],
)

print(textwrap.fill(response.choices[0].message.content, 50))
`;

const exampleCurl = `curl https://chatapi.akash.network/api/v1/chat/completions \\
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
import json
import sys
json.dump(json.load(sys.stdin), sys.stdout, indent=2)
print()
'`;

const exampleAxios = `import axios from 'axios';

const client = axios.create({
  baseURL: 'https://chatapi.akash.network/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-xxxxxxxx'
  }
});

async function chat() {
  try {
    const response = await client.post('/chat/completions', {
      model: "Meta-Llama-3-1-8B-Instruct-FP8",
      messages: [
        {
          role: "user",
          content: "Who are you?"
        }
      ]
    });
    
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

chat();`;

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<'python' | 'curl' | 'axios'>('python');

  return (
    <div className="flex flex-col gap-6 max-w-full px-4 sm:px-0">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">AkashChat API Documentation</h1>
        
        {/* Help banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
          <p className="text-gray-600 text-sm sm:text-base">
            Need help? Reach out to us on{" "}
            <a 
              href="https://discord.com/invite/akash" 
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left navigation sidebar - hidden on mobile, shown on lg screens */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <h3 className="text-lg font-medium mb-4 text-gray-900">On this page</h3>
            <nav className="flex flex-col gap-2">
              {[
                { title: "Using the API", href: "#using-the-api" },
                { title: "Authentication", href: "#authentication" },
                { title: "Examples", href: "#examples" },
                { title: "Available Models", href: "#models" },
              ].map((item) => (
                <div key={item.title}>
                  <a 
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
                  >
                    {item.title}
                  </a>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile navigation - shown on mobile, hidden on lg screens */}
        <div className="lg:hidden mb-8">
          <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-2 text-gray-900">On this page</h3>
            {[
              { title: "Using the API", href: "#using-the-api" },
              { title: "Authentication", href: "#authentication" },
              { title: "Examples", href: "#examples" },
              { title: "Available Models", href: "#models" },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="text-sm text-gray-700 hover:text-gray-900 py-1 block"
              >
                {item.title}
              </a>
            ))}
          </div>
        </div>

        {/* Center content column */}
        <div className="flex-grow max-w-3xl prose prose-gray">
          <section id="using-the-api" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Using the API</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                The AkashChat API is compatible with the OpenAI API standard.
                See the examples below for how to interact with the API.
              </p>
            </div>
          </section>

          <section id="authentication" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Authentication</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                All requests require an API key passed in the Authorization header.
              </p>
            </div>
          </section>

          <section id="examples" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Examples</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab buttons */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('python')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'python'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Python with OpenAI SDK
                </button>
                <button
                  onClick={() => setActiveTab('axios')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'axios'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  JavaScript (Axios)
                </button>
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'curl'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  cURL Example
                </button>
              </div>

              {/* Tab content */}
              <div className="p-0">
                {activeTab === 'python' && (
                  <Code code={exampleCode} codeStyle={customStyle as any} />
                )}
                {activeTab === 'axios' && (
                  <Code code={exampleAxios} codeStyle={customStyle as any} />
                )}
                {activeTab === 'curl' && (
                  <Code code={exampleCurl} codeStyle={customStyle as any} />
                )}
              </div>
            </div>
          </section>

          <section id="models" className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Available Models</h2>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg divide-y divide-gray-100">
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
                <div key={model.model} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800 w-fit">
                      {model.model}
                    </code>
                    <div className="flex gap-4 text-sm">
                      <a 
                        href={model.href}
                        className="text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Model details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
