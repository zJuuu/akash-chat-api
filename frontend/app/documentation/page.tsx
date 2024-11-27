"use client";

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import Code from '@/components/code';
import customStyle from '@/lib/codestyle';

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

export default async function Documentation() {

  return (
    <div className="flex flex-col gap-6 max-w-full">
      <h1 className="text-3xl font-bold">Akash Chat API - Documentation</h1>
      <div>
        The Akash Chat API is compatible with the OpenAI API standard.
        See the examples below for how to interact with the API.
      </div>

      <div>
        If you need help or have questions, please reach out to us in the Akash Discord at: 
        <br />
        <a href="https://discord.com/invite/akash">https://discord.com/invite/akash</a>
      </div>
      
      <div>
        <h4 className="text-2xl font-bold">Available Models</h4>
        <div>
          <table className="table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Model ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Meta-Llama-3-1-8B-Instruct-FP8</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Meta-Llama-3-1-405B-Instruct-FP8</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Meta-Llama-3-2-3B-Instruct</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">nvidia-Llama-3-1-Nemotron-70B-Instruct-HF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="text-2xl font-bold">Example: With Python and the OpenAI SDK</h4>
        <Code code={exampleCode} codeStyle={customStyle as any}/>
      </div>
      <div>
        <h4 className="text-2xl font-bold">Example: With Curl and Python</h4>
        <Code code={exampleCurl} codeStyle={customStyle as any}/>
      </div>
    </div>
  );
}
