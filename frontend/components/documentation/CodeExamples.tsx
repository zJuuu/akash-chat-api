"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Code from '@/components/code';
import { exampleAxios, exampleCode, exampleCurl } from '../../app/constants/codeExamples';

export default function CodeExamples() {
  const [activeTab, setActiveTab] = useState<'python' | 'curl' | 'axios'>('python');

  return (
    <section id="examples" className="mb-8 sm:mt-12">
      <h2 className="text-xl font-medium mb-4">Examples</h2>
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'python' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('python')}
          className={`h-8 px-4 text-sm rounded-full ${activeTab === 'python'
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
          Python & OpenAI
        </Button>
        <Button
          variant={activeTab === 'axios' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('axios')}
          className={`h-8 px-4 text-sm rounded-full ${activeTab === 'axios'
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
          JavaScript
        </Button>
        <Button
          variant={activeTab === 'curl' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('curl')}
          className={`h-8 px-4 text-sm rounded-full ${activeTab === 'curl'
              ? 'text-foreground bg-muted'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
          curl
        </Button>
      </div>
      <div className="bg-[#18181B] rounded-lg overflow-hidden -mx-2 xs:-mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <div className="min-w-[300px]">
            {activeTab === 'python' && (
              <Code code={exampleCode} />
            )}
            {activeTab === 'axios' && (
              <Code code={exampleAxios} />
            )}
            {activeTab === 'curl' && (
              <Code code={exampleCurl} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}