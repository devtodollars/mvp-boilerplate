import * as React from 'react';

import { cn } from '@/utils/cn';

function Section({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      data-slot="section"
      className={cn('line-b px-4 py-12 sm:py-24 md:py-32', className)}
      {...props}
    />
  );
}

export { Section };
