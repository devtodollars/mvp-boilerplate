
export default function AboutMe() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20">

          {/* Section header */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-8 mb-8">
              <img className="rounded-full" src="img/me.jpeg" width={96} height={96} alt="Features bg" />
              <h2 className="text-5xl font-wood mb-0">Hey, I'm Matt 👋</h2>
            </div>
            <p className="text-xl font-mont text-left mb-8">I'm a former <a href="/blog/from-cto-of-yc-backed-startup-back-to-indiehacker">CTO of a YC backed startup</a>. I've built over 5 apps with the most recent startup gaining over 100,000 users.</p>
            <p className="text-xl font-mont text-left mb-8">Initially, my plan was to create a boilerplate for future startups, share it with some folks, and earn some cash along the way. However, after talking with users, I found joy in helping them launch their startups. So, now I'm on a mission to <b>help developers become founders</b>.</p>
            <p className="text-xl font-mont text-left mb-8">Want more? <a href="https://x.com/ithinkwong">Follow me on 𝕏</a></p>
          </div>

        </div>
      </div>
    </section>
  )
}
