export const exampleCode = `import openai
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

export const exampleCurl = `curl https://chatapi.akash.network/api/v1/\\
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

export const exampleAxios = `import axios from 'axios'

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