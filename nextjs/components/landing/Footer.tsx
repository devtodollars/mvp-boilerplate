'use client';
import { LogoIcon } from './Icons';
import { ModeToggle } from './mode-toggle';

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const columns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { text: 'Features', href: '/#features' },
      { text: 'Pricing', href: '/#pricing' },
      { text: 'FAQ', href: '/#faq' }
    ]
  },
  {
    title: 'Company',
    links: [
      { text: 'About', href: '#' },
      { text: 'Blog', href: '#' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { text: 'Github', href: '#' },
      { text: 'Twitter', href: '#' },
      { text: 'Discord', href: '#' }
    ]
  }
];

const policies: FooterLink[] = [
  { text: 'Privacy Policy', href: '#' },
  { text: 'Terms of Service', href: '#' }
];

export const Footer = () => {
  return (
    <footer className="bg-background w-full px-4">
      <div className="max-w-container mx-auto">
        <div className="grid gap-8 py-12 md:grid-cols-5">
          <div className="col-span-2">
            <a
              rel="noreferrer noopener"
              href="/"
              className="flex items-center gap-2"
            >
              <LogoIcon />
              <h3 className="text-xl font-bold">DevToDollars</h3>
            </a>
          </div>
          {columns.map((column, index) => (
            <div key={index} className="flex flex-col gap-2">
              <h3 className="text-md pt-1 font-semibold">{column.title}</h3>
              {column.links.map((link, linkIndex) => (
                <a
                  key={linkIndex}
                  href={link.href}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t py-8 sm:flex-row">
          <div className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} DevToDollars. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm">
            {policies.map((policy, index) => (
              <a
                key={index}
                href={policy.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {policy.text}
              </a>
            ))}
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
