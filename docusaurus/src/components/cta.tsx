export default function Cta() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pb-12 md:pb-20">

          {/* CTA box */}
          <div className="bg-gray-700 rounded-2xl py-10 px-8 md:py-16 md:px-12 shadow-2xl" data-aos="zoom-y-out">

            <div className="flex flex-col lg:flex-row justify-between items-center">

              {/* CTA content */}
              <div className="mb-6 lg:mr-16 lg:mb-0 text-center lg:text-left">
                <h2 className="text-4xl text-white mb-2 font-wood">Ready to be a founder?</h2>
                <p className="text-lg text-white opacity-75 font-mont">Join our community and start earning your first dollars</p>
              </div>

              {/* CTA button */}
              <div>
                <a className="btn bg-[#7289da] text-white hover:no-underline hover:text-white hover:bg-gray-800" href="https://discord.gg/6q63Xa6SEB">Join Discord Community</a>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
