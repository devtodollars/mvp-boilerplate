'use client';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: 'Trust & Safety',
    description:
      "Our trust system is simple: we verify every user's ID, we hold your deposit securely, and we only release it after the keys are in the tenant's hands. You're protected from start to finish",
    image: '/feat3.png'
  },
  {
    title: 'The Application Queue',
    description:
      "Say goodbye to the application black hole. Our transparent queuing system gives renters peace of mind by showing them exactly where they stand, while giving landlords the tools to manage applications without the chaotic inbox spam. It's order, clarity, and fairness for both sides.",
    image: '/feat2.png'
  },
  {
    title: 'Profiles & In-App Communication',
    description:
    "Stop sending your life story and personal documents into the void. Build one secure, reusable profile and apply for places with a click. Chat safely with our in-app messaging, keeping your personal number private until you're ready to share it.",
    image: '/feat1.png'
  }
];

const featureList: string[] = [
  "ID-Verified users",
  "Scam and Deposit protection",
  "Tenant profiles",
  "Transparent queueing system",
  "Secure Escrow Deposits",
  "No More Email Spam",
  "ApplicationTracking",
  "One-Click Apply",
  "Secure In App Chat"
];

export const Features = () => {
  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Many{' '}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Unique Features
        </span>
      </h2>

      <div className="flex flex-wrap md:justify-center gap-4">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge variant="secondary" className="text-sm">
              {feature}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent>{description}</CardContent>

            <CardFooter>
              <img
                src={image}
                alt="About feature"
                className="w-[300px] lg:w-[500px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
