import { useState, useRef, useEffect } from 'react'
import { Transition } from '@headlessui/react'

export default function FeaturesHome() {

  const [tab, setTab] = useState<number>(1)

  const tabs = useRef<HTMLDivElement>(null)

  const heightFix = () => {
    if (tabs.current && tabs.current.parentElement) tabs.current.parentElement.style.height = `${tabs.current.clientHeight}px`
  }

  useEffect(() => {
    heightFix()
  }, [])

  return (
    <section id="how-we-help" className="relative bg-gray-700">

      {/* Section background (needs .relative class on parent and next sibling elements) */}
      <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">

          {/* Section content */}
          <div className="md:grid md:grid-cols-12 md:gap-6">

            {/* Content */}
            <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6" data-aos="fade-right">
              <div className="md:pr-4 lg:pr-12 xl:pr-16 mb-8">
                <h2 className="text-4xl mb-3 font-wood">How I help you</h2>
                <p className="text-l font-mont">Everything you need to build a startup from the <span className="text-primary">CTO of a YC backed company</span> to build a startup</p>
              </div>
              {/* Tabs buttons */}
              <div className="mb-8 md:mb-0">
                <button
                  className={`text-left flex items-center text-lg p-5 rounded-2xl border-transparent transition duration-300 ease-in-out mb-3 ${tab !== 1 ? 'bg-gray-800 shadow-lg hover:shadow-2xl' : 'bg-gray-900'}`}
                  onClick={(e) => { e.preventDefault(); setTab(1); }}
                >
                  <div>
                    <div className="font-bold leading-snug tracking-tight mb-1">Boilerplate Code</div>
                    <div className="text-gray-400">Fully configured code to get up and running with your startup in 30 minutes</div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow shrink-0 ml-3">
                    💻
                  </div>
                </button>
                <button
                  className={`text-left flex items-center text-lg p-5 rounded-2xl border-transparent transition duration-300 ease-in-out mb-3 ${tab !== 2 ? 'bg-gray-800 shadow-lg hover:shadow-2xl' : 'bg-gray-900'}`}
                  onClick={(e) => { e.preventDefault(); setTab(2); }}
                >
                  <div>
                    <div className="font-bold leading-snug tracking-tight mb-1">Startup Resources</div>
                    <div className="text-gray-400">All the books, youtube videos, and blogs I read to get to where I am today</div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow shrink-0 ml-3">
                    📈
                  </div>
                </button>
                <button
                  className={`text-left flex items-center text-lg p-5 rounded-2xl border-transparent transition duration-300 ease-in-out mb-3 ${tab !== 3 ? 'bg-gray-800 shadow-lg hover:shadow-2xl' : 'bg-gray-900'}`}
                  onClick={(e) => { e.preventDefault(); setTab(3); }}
                >
                  <div>
                    <div className="font-bold leading-snug tracking-tight mb-1">Community + Paid opportunities</div>
                    <div className="text-gray-400">Meet people in the same stage as you and find co-founders through paid projects</div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow shrink-0 ml-3">
                    💰
                    {/* <svg className="w-3 h-3 fill-current" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"> */}
                    {/*   <path d="M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z" fill="#191919" fillRule="nonzero" /> */}
                    {/* </svg> */}
                  </div>
                </button>
              </div>
            </div>

            {/* Tabs items */}
            <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1">
              <div className="transition-all">
                <div className="relative flex flex-col text-center lg:text-right" data-aos="zoom-y-out" ref={tabs}>
                  {/* Item 1 */}
                  <Transition
                    show={tab === 1}
                    className="w-full"
                    enter="transition ease-in-out duration-700 transform order-first"
                    enterFrom="opacity-0 translate-y-16"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in-out duration-300 transform absolute"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-16"
                    beforeEnter={() => heightFix()}
                    unmount={false}
                  >
                    <div className="relative inline-flex flex-col">
                      <img className="md:max-w-none mx-auto rounded" src="img/devtodollars.png" width={500} height={375} alt="Features bg" />
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src="img/devtodollars.png" width={500} height={147} alt="Element 01" style={{ top: '22%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float animation-delay-500" src="img/devtodollars.png" width={500} height={158} alt="Element 02" style={{ top: '39%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 bottom-0 transform animate-float animation-delay-1000" src="img/devtodollars.png" width={500} height={167} alt="Element 03" style={{ top: '77%' }} /> */}
                    </div>
                  </Transition>
                  {/* Item 2 */}
                  <Transition
                    show={tab === 2}
                    className="w-full"
                    enter="transition ease-in-out duration-700 transform order-first"
                    enterFrom="opacity-0 translate-y-16"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in-out duration-300 transform absolute"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-16"
                    beforeEnter={() => heightFix()}
                    unmount={false}
                  >
                    <div className="relative inline-flex flex-col">
                      <img className="md:max-w-none mx-auto rounded" src="img/devtodollars.png" width={500} height={375} alt="Features bg" />
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src="img/devtodollars.png" width={500} height={147} alt="Element 01" style={{ top: '22%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float animation-delay-500" src="img/devtodollars.png" width={500} height={158} alt="Element 02" style={{ top: '39%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 bottom-0 transform animate-float animation-delay-1000" src="img/devtodollars.png" width={500} height={167} alt="Element 03" style={{ top: '77%' }} /> */}
                    </div>
                  </Transition>
                  {/* Item 3 */}
                  <Transition
                    show={tab === 3}
                    className="w-full"
                    enter="transition ease-in-out duration-700 transform order-first"
                    enterFrom="opacity-0 translate-y-16"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in-out duration-300 transform absolute"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-16"
                    beforeEnter={() => heightFix()}
                    unmount={false}
                  >
                    <div className="relative inline-flex flex-col">
                      <img className="md:max-w-none mx-auto rounded" src="img/devtodollars.png" width={500} height={375} alt="Features bg" />
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src="img/devtodollars.png" width={500} height={147} alt="Element 01" style={{ top: '22%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 transform animate-float animation-delay-500" src="img/devtodollars.png" width={500} height={158} alt="Element 02" style={{ top: '39%' }} /> */}
                      {/* <img className="md:max-w-none absolute w-full left-0 bottom-0 transform animate-float animation-delay-1000" src="img/devtodollars.png" width={500} height={167} alt="Element 03" style={{ top: '77%' }} /> */}
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
