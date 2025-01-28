import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useState } from 'react';

interface CodeProps {
  code: string;
  codeStyle: any;
}

export default function Code({ code, codeStyle }: CodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-2 rounded-lg bg-gray-800/10 hover:bg-gray-800/20 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      
      <div onClick={(e) => e.stopPropagation()} className="select-text">
        <SyntaxHighlighter
          style={codeStyle}
          customStyle={{
            padding: '1rem',
            borderRadius: '0.5rem',
            margin: 0,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}