export default function HeroHome() {
  return (
    <section className="relative overflow-hidden">
      {/* Illustration behind hero content */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -z-1" aria-hidden="true">
        <svg width="1360" height="578" viewBox="0 0 1360 578" xmlns="http://www.w3.org/2000/svg" className="overflow-hidden">
          <g>
            <image x="1100" y="0" href="img/devtodollars.png" width={256} height={256} />
            <image x="100" y="403" href="img/devtodollars.png" width={128} height={128} />
          </g>
        </svg>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Hero content */}
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">

          {/* Section header */}
          <div className="text-center pb-12 md:pb-16">
            <h1 className="font-wood text-7xl md:text-8xl font-extrabold tracking-wide leading-tighter mb-4" data-aos="zoom-y-out">We Help Developers<br /><span className="bg-clip-text text-transparent bg-primary">Become Founders</span></h1>
            <div className="max-w-3xl mx-auto">
              <p className="font-mont text-xl text-white mb-8" data-aos="zoom-y-out" data-aos-delay="150">Earn your first dollars with the support of community, resources, and paid opportunities</p>
              <div className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center font-body gap-4" data-aos="zoom-y-out" data-aos-delay="300">
                <div>
                  <a className="btn text-white bg-[#7289da] hover:bg-black hover:text-white w-full mb-4 sm:w-auto sm:mb-0 hover:no-underline" href="#0">Join Discord Community</a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
