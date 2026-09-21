import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why Deliverly exists, how it is built, and an honest account of where it currently is.',
}

/**
 * What this page is not.
 *
 * It previously carried four invented staff members with emoji portraits, a
 * founding story dated 2022, and the same "500+ businesses / 10k+ daily
 * deliveries / 99.9% uptime" figures the landing page removed for being false.
 *
 * None of it was true, and an about page is the one page where that matters
 * most — it is where a reader goes specifically to find out who they would be
 * dealing with. So the invented people and numbers are gone rather than
 * restyled, and what is left is the part that can be checked: why the thing
 * exists, the decisions visible in how it behaves, and where it honestly is.
 */

/**
 * Principles, each tied to something the code actually does.
 *
 * "Customer First / Innovation / Teamwork / Excellence" was the previous set.
 * Those are not principles, they are the absence of one — no product has ever
 * claimed the opposite.
 */
const PRINCIPLES = [
  {
    n: '01',
    title: 'Correct costs more than quick, and is worth it',
    body: 'A rider taps delivered, the connection drops, they tap it again. The naive version fulfils that order twice in Shopify and the merchant finds out from a customer. Deliverly recognises the second submission as the same delivery and tells Shopify exactly once. Most of the engineering here is that kind of problem.',
  },
  {
    n: '02',
    title: 'The network is a hope, not a fact',
    body: 'Deliveries happen in stairwells, basements and underground car parks. Every delivery is written to the rider’s phone before the network is touched and sent when there is something to send it over, because a proof of delivery that depends on coverage is not proof of anything.',
  },
  {
    n: '03',
    title: 'A failed delivery is an outcome, not a gap',
    body: 'Plenty of systems model success and treat everything else as a stop that never closed. Nobody was home, the address was wrong, the customer refused it — these are recorded with reasons, because they are the ones somebody has to do something about tomorrow morning.',
  },
  {
    n: '04',
    title: 'A number on a screen should be a real number',
    body: 'Today’s order count is computed in the store’s own timezone, so a 1am order counts as tonight rather than silently landing in yesterday. The same rule applies to this website: there are no invented figures on it, which is why there is no wall of statistics on this page.',
  },
] as const

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader />

      <main id="main">
        {/* ---------------------------------------------------------------
            Hero
            --------------------------------------------------------------- */}
        <section className="relative grain overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-56 h-[38rem] w-[38rem] rounded-full opacity-[0.14] blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--ember)) 0%, transparent 65%)',
            }}
          />

          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-36 md:pb-24 md:pt-44">
            <p className="figures text-xs uppercase tracking-[0.2em] text-ink-2">
              About
            </p>

            <h1 className="mt-6 max-w-[20ch] font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              Built for the part of the order nobody watches.
            </h1>

            <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-ink-2">
              Shopify is very good at taking money. What happens in the hours
              afterwards — who is carrying the parcel, whether it arrived, and
              how anyone finds out — tends to live in a group chat and a
              spreadsheet. Deliverly is that gap, given a system.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Why. A single column at reading measure: this is the one part of
            the site that is genuinely prose and should be set as prose.
            --------------------------------------------------------------- */}
        <section className="border-t border-ink/[0.07] bg-paper-2/60">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:sticky lg:top-28">
                  Why it exists
                </h2>
              </div>

              <div className="max-w-[62ch] space-y-6 text-lg leading-relaxed text-ink-2 lg:col-span-8">
                <p>
                  A merchant running their own deliveries ends up with the same
                  arrangement every time. Orders are copied out of Shopify into a
                  sheet. Riders are given their stops over WhatsApp. A photo of a
                  doorstep goes into a chat thread where it is lost by Thursday.
                  Then somebody sits down at the end of the day and marks orders
                  fulfilled, from memory, one at a time.
                </p>
                <p>
                  It works, in the sense that parcels arrive. What it does not do
                  is survive contact with a bad day — a rider whose phone died, a
                  customer who says they never received it, an order fulfilled
                  twice because two people were tidying up the same list.
                </p>
                <p>
                  Every one of those failures is a bookkeeping problem rather than
                  a driving problem. So this is bookkeeping software that happens
                  to have a map in it: the order moves from paid to delivered, and
                  every hand it passes through is recorded as it happens instead
                  of reconstructed afterwards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Principles
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-24 md:py-28">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              What it was built to get right
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-2">
              Four decisions that shaped the rest of it. Each one is visible in
              how the product behaves rather than asserted here.
            </p>
          </div>

          <ol className="mt-16 space-y-px overflow-hidden rounded-2xl bg-ink/[0.07]">
            {PRINCIPLES.map(({ n, title, body }) => (
              <li
                key={n}
                className="bg-paper p-8 transition-colors duration-300 hover:bg-paper-2 sm:p-10"
              >
                <div className="grid gap-5 sm:grid-cols-12 sm:gap-8">
                  <div className="sm:col-span-4">
                    <span className="figures text-sm text-ink-2/60">{n}</span>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight">
                      {title}
                    </h3>
                  </div>
                  <p className="max-w-[62ch] leading-relaxed text-ink-2 sm:col-span-8">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------------
            Where it actually is. This replaces the fabricated statistics
            block. Stating the real position is more use to a merchant
            deciding whether to trust it than a number that is not true.
            --------------------------------------------------------------- */}
        <section className="relative grain bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <p className="figures text-xs uppercase tracking-[0.2em] text-paper/40">
                  Where it is
                </p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Small, and honest about it.
                </h2>
              </div>

              <div className="max-w-[60ch] space-y-6 leading-relaxed text-paper/65 lg:col-span-8">
                <p>
                  Deliverly runs a real delivery operation every day. It is one
                  operation. There is no fleet of enterprise logos to show you and
                  no five-figure delivery count, and inventing either would be a
                  strange way to begin a relationship with someone whose orders we
                  are asking to handle.
                </p>
                <p>
                  What that buys you is a product corrected by reality rather than
                  by a roadmap. First sync was rewritten after meeting a store
                  with thirteen thousand orders of history. The timezone handling
                  exists because a Gulf merchant&rsquo;s late-night orders kept
                  landing on the wrong day. The offline path exists because riders
                  kept walking into buildings.
                </p>
                <p className="text-paper/80">
                  If you are weighing it up: ask for the parts you would depend
                  on, and ask what is not built. Both lists are things we will
                  give you straight.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            CTA
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-24 md:py-28">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="max-w-[20ch] font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Questions are better than a brochure.
              </h2>
              <p className="mt-4 max-w-[48ch] leading-relaxed text-ink-2">
                Tell us what your deliveries look like and we will tell you
                whether this fits.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-medium text-paper shadow-lg shadow-ink/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 active:translate-y-0 active:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                Get in touch
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/features"
                className="text-sm font-medium text-ink-2 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ember"
              >
                See what it does
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
