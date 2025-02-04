import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useState, useEffect } from 'react';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Check } from 'lucide-react';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);

interface CodeProps {
  code: string;
}

export default function Code({ code }: CodeProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 390);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getLanguage = () => {
    if (code.includes('curl')) return 'bash';
    if (code.includes('import axios')) return 'javascript';
    return 'python';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="relative overflow-hidden py-1 px-1">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-accent/10 transition-colors z-10"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500 transition-all duration-200 ease-spring scale-125" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>
      <SyntaxHighlighter
        language={getLanguage()}
        style={atomOneDark}
        customStyle={{
          padding: isSmallScreen ? '0.5rem' : '0.75rem',
          margin: 0,
          fontSize: isSmallScreen ? '11px' : '12px',
          lineHeight: isSmallScreen ? '16px' : '18px',
          maxWidth: '100%',
          wordBreak: 'break-word',
          backgroundColor: '#18181B',
          borderRadius: 0,
        }}
        showLineNumbers={true}
        lineNumberStyle={{
          minWidth: isSmallScreen ? '1.5em' : '2em',
          paddingRight: '0.5em',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          opacity: 0.5,
          userSelect: 'none',
          color: '#6272A4',
          textAlign: 'right',
          marginRight: '0.5em',
          borderRight: '1px solid #27272A'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}