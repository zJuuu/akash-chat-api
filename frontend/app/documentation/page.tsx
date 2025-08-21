import { Globe, ChartColumnIncreasing, ChartBarBig, Github, Book } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getModelsData } from '@/lib/models-server';
import CodeExamples from '@/components/documentation/CodeExamples';
import ModelsList from '@/components/documentation/ModelsList';
import TableOfContents from '@/components/documentation/TableOfContents';

// ISR: Revalidate every 30 minutes (1800 seconds)
export const revalidate = 1800;

export default async function Documentation() {
  // Fetch models data server-side
  const modelsData = await getModelsData();

  return (
    <div className="min-h-screen">
      {/* Main content and sidebars */}
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-0 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left Sidebar */}
          <div className="hidden lg:block w-64 border-r border-border">
            <div className="pr-5 lg:pr-8 space-y-4 sticky top-4">
              <div>
                <h3 className="text-muted-foreground uppercase text-xs font-regular mb-[5%]">Tools</h3>
                <nav className="space-y-2">
                  <Link href="https://console.akash.network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Globe className="w-4 h-4 text-foreground" />
                      <span>Akash Console</span>
                    </Button>
                  </Link>
                  <Link href="https://chat.akash.network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Globe className="w-4 h-4 text-foreground" />
                      <span>AkashChat</span>
                    </Button>
                  </Link>
                  <Link href="https://gen.akash.network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Globe className="w-4 h-4 text-foreground" />
                      <span>AkashGen</span>
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="h-px bg-border" />

              <div>
                <h3 className="text-muted-foreground uppercase text-xs font-regular mb-[5%]">Resources</h3>
                <nav className="space-y-2">
                  <Link href="https://stats.akash.network/" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <ChartColumnIncreasing className="w-4 h-4 text-foreground" />
                      <span>Akash Stats</span>
                    </Button>
                  </Link>
                  <Link href="https://akash.network/pricing/gpus" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <ChartBarBig className="w-4 h-4 text-foreground" />
                      <span>Price Compare</span>
                    </Button>
                  </Link>
                  <Link href="https://akash.network/docs" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Book className="w-4 h-4 text-foreground" />
                      <span>Akash Docs</span>
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="h-px bg-border" />

              <div>
                <h3 className="text-muted-foreground uppercase text-xs font-regular mb-[5%]">Follow Akash</h3>
                <nav className="space-y-2">
                  <Link href="https://github.com/akash-network" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Github className="w-4 h-4 text-foreground" />
                      <span>Akash Github</span>
                    </Button>
                  </Link>
                  <Link href="https://twitter.com/akashnet_" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-foreground">
                        <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Akash on X</span>
                    </Button>
                  </Link>
                  <Link href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" className="w-4 h-4 text-foreground">
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
                      className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" className="w-4 h-4 text-foreground">
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
              <section id="using-the-api">
                <h1
                  className="text-2lg font-semibold tracking-tight text-foreground mb-3"
                >
                  Getting Started
                </h1>
                <h2 className="text-xl font-regular text-muted-foreground mb-3">
                  Using the AkashChat API
                </h2>
              </section>
            </div>

            <section className="mt-8 sm:mt-12">
              <p className="text-muted-foreground mb-6">
                The AkashChat API provides a simple interface to access the leading open-source AI models powered by the Akash Supercloud.
              </p>
              <p className="text-muted-foreground mb-6">
                Akash is a permissionless marketplace for cloud resources with competitive pricing compared to traditional cloud providers.
              </p>
              <p className="text-muted-foreground mb-6">
                It's easy to get started, as the AkashChat API is compatible with the OpenAI API standard. If you're already running on the OpenAI API, it's simple to make the switch. If you're just getting started, see the examples below for interacting with the API.
              </p>
              <p className="text-muted-foreground mb-8">
                If you need any support, the Akash community is available around the clock to help. For immediate support, please reach out on Discord. For larger issues or feature requests, feel free to start a Discussion on GitHub.
              </p>
            </section>

            <section className="mb-8 sm:mb-12">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://github.com/orgs/akash-network/discussions" target="_blank" rel="noopener noreferrer">
                  <button
                    className="inline-flex items-center justify-center font-medium gap-x-1.5 not-prose border border-border text-muted-foreground hover:bg-muted bg-card shadow-sm px-2.5 py-1.5 lg:px-3 lg:py-2 text-sm rounded-md w-full"
                  >
                    <Github className="w-3.5 h-3.5" />
                    GitHub Discussions
                  </button>
                </Link>
                <Link href="https://discord.com/invite/akash" target="_blank" rel="noopener noreferrer">
                  <button
                    className="inline-flex items-center justify-center font-medium gap-x-1.5 not-prose border border-border text-muted-foreground hover:bg-muted bg-card shadow-sm px-2.5 py-1.5 lg:px-3 lg:py-2 text-sm rounded-md w-full"
                  >
                    <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" className="w-4 h-4 text-muted-foreground">
                      <path d="M5.5 16C10.5 18.5 13.5 18.5 18.5 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 17.5L16.5 19.5C16.5 19.5 20.6713 18.1717 22 16C22 15 22.5301 7.85339 19 5.5C17.5 4.5 15 4 15 4L14 6H12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.52832 17.5L7.52832 19.5C7.52832 19.5 3.35699 18.1717 2.02832 16C2.02832 15 1.49823 7.85339 5.02832 5.5C6.52832 4.5 9.02832 4 9.02832 4L10.0283 6H12.0283" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 14C7.67157 14 7 13.1046 7 12C7 10.8954 7.67157 10 8.5 10C9.32843 10 10 10.8954 10 12C10 13.1046 9.32843 14 8.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 14C14.6716 14 14 13.1046 14 12C14 10.8954 14.6716 10 15.5 10C16.3284 10 17 10.8954 17 12C17 13.1046 16.3284 14 15.5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Akash Discord</span>
                  </button>
                </Link>
              </div>
            </section>

            <CodeExamples />

            <ModelsList 
              chatModels={modelsData.chatModels} 
              embeddingModels={modelsData.embeddingModels} 
            />
          </div>

          {/* Right Sidebar */}
          <TableOfContents />
        </div>
      </div>
    </div>
  );
}
