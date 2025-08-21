"use client";

import { Button } from '@/components/ui/button';

const navigationItems = [
  { title: "Using the API", href: "#using-the-api" },
  { title: "Examples", href: "#examples" },
  { title: "Available Models", href: "#models" },
];

export default function TableOfContents() {
  const handleScrollTo = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-4">
        <h3 className="text-muted-foreground uppercase text-xs font-regular mb-[5%]">On this page</h3>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="w-full justify-start gap-2 h-8 px-2 text-sm font-[400] text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                handleScrollTo(item.href);
              }}
            >
              <span>{item.title}</span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}