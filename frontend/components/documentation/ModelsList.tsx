"use client";

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedModel } from '@/lib/models-server';

interface ModelsListProps {
  chatModels: ProcessedModel[];
  embeddingModels: ProcessedModel[];
}

export default function ModelsList({ chatModels, embeddingModels }: ModelsListProps) {
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  const handleCopyModel = (modelName: string) => {
    navigator.clipboard.writeText(modelName);
    setCopiedModel(modelName);
    setTimeout(() => setCopiedModel(null), 1000);
  };

  return (
    <section id="models" className="mt-8 sm:mt-12 -mx-2 xs:-mx-4 sm:mx-0">
      <h2 className="text-xl font-medium mb-4 px-2 xs:px-4 sm:px-0">Available Models</h2>

      {/* Chat + Completions Models */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3 px-2 xs:px-4 sm:px-0 text-gray-700">Chat + Completions</h3>
        <div className="bg-card rounded-lg divide-y divide-gray-100 overflow-hidden">
          {chatModels.map((model) => (
            <div key={model.model} className="p-3 xs:p-4 hover:bg-muted transition-colors">
              <div className="flex items-center justify-between gap-4 min-w-0">
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                  onClick={() => handleCopyModel(model.model)}
                >
                  <div className="relative">
                    {copiedModel === model.model ? (
                      <Check className="w-3.5 h-3.5 text-green-500 transition-all duration-200 ease-spring scale-125" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-muted-foreground transition-colors" />
                    )}
                  </div>
                  <code className="px-2 py-1 bg-muted rounded text-xs xs:text-sm font-mono text-muted-foreground break-all">
                    {model.model}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  asChild
                  className="h-7 px-2 text-xs xs:text-sm font-light text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
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
          ))}
        </div>
      </div>

      {/* Embedding Models */}
      <div>
        <h3 className="text-lg font-medium mb-3 px-2 xs:px-4 sm:px-0 text-gray-700">Embedding</h3>
        <div className="bg-card rounded-lg divide-y divide-gray-100 overflow-hidden">
          {embeddingModels.map((model) => (
            <div key={model.model} className="p-3 xs:p-4 hover:bg-muted transition-colors">
              <div className="flex items-center justify-between gap-4 min-w-0">
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                  onClick={() => handleCopyModel(model.model)}
                >
                  <div className="relative">
                    {copiedModel === model.model ? (
                      <Check className="w-3.5 h-3.5 text-green-500 transition-all duration-200 ease-spring scale-125" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-muted-foreground transition-colors" />
                    )}
                  </div>
                  <code className="px-2 py-1 bg-muted rounded text-xs xs:text-sm font-mono text-muted-foreground break-all">
                    {model.model}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  asChild
                  className="h-7 px-2 text-xs xs:text-sm font-light text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
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
          ))}
        </div>
      </div>
    </section>
  );
}