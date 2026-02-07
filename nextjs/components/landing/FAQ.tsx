'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Section } from '@/components/ui/section';

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: 'Is this template free?',
    answer: 'Yes. It is a free ChadcnUI template.',
    value: 'item-1'
  },
  {
    question: 'Lorem ipsum dolor sit amet consectetur adipisicing elit?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sint labore quidem quam? Consectetur sapiente iste rerum reiciendis animi nihil nostrum sit quo, modi quod.',
    value: 'item-2'
  },
  {
    question:
      'Lorem ipsum dolor sit amet Consectetur natus dolores minus quibusdam?',
    answer:
      'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore qui nostrum reiciendis veritatis necessitatibus maxime quis ipsa vitae cumque quo?',
    value: 'item-3'
  },
  {
    question: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit?',
    answer: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit.',
    value: 'item-4'
  },
  {
    question:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur natus?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sint labore quidem quam? Consectetur sapiente iste rerum reiciendis animi nihil nostrum sit quo, modi quod.',
    value: 'item-5'
  }
];

export const FAQ = () => {
  return (
    <Section id="faq">
      <div className="max-w-container mx-auto flex flex-col items-center gap-8">
        <h2 className="text-center text-3xl font-semibold sm:text-5xl">
          Frequently Asked Questions
        </h2>

        <Accordion
          type="single"
          collapsible
          className="w-full max-w-[800px] AccordionRoot"
        >
          {FAQList.map(({ question, answer, value }: FAQProps) => (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger className="text-left">
                {question}
              </AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="font-medium">
          Still have questions?{' '}
          <a
            rel="noreferrer noopener"
            href="#"
            className="text-primary transition-all border-primary hover:border-b-2"
          >
            Contact us
          </a>
        </p>
      </div>
    </Section>
  );
};
