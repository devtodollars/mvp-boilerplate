'use client';

import { Statistics } from '@/components/landing/Statistics';

export const About = () => {
  return (
    <section id="about" className="container py-24 sm:py-32">
      <div className="bg-muted/50 border rounded-lg py-12">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src="/landing/groupphoto.PNG"
            alt=""
            className="w-[500px] object-contain rounded-lg"
          />
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                Discover{' '}
                </span>
                the Brains behind the operation 🧠
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
              We are three lads renting in Ireland with a mixture of tech and business backgrounds. We've felt the pain of trying to find somewhere to rent in places like Dublin, Waterford or Galway and we've paid exorbitant prices and dodged plenty of scams. This birthed the idea of creating a competitor to the big platforms that don't have the features to match the huge price tags.
              </p>
            </div>

       
          </div>
        </div>
      </div>
    </section>
  );
};
