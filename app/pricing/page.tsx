import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Deliverly is priced per store, based on order volume and how many riders are on the road. Tell us about your operation and we will quote it.',
}

/**
 * No tiers, and no numbers.
 *
 * This page previously advertised four plans, a fourteen-day trial and a
 * thirty-day refund guarantee, none of which exist. A table of invented prices
 * is worse than no table: it is a commitment made on the merchant's behalf by
 * a page nobody checked.
 *
 * So the page says what is true — that pricing is quoted per store — and sends
 * the reader to a person. If fixed tiers are settled later, they belong here in
 * place of this.
 */

/** Everything the product does is included. There is nothing to unlock. */
const INCLUDED = [
  'Unlimited orders synced from Shopify',
  'Every rider on your team',
  'The dispatch queue and assignment',
  'The rider app, including offline capture',
  'Proof of delivery photos and GPS stamps',
  'Live rider positions on the map',
  'Customer tracking links',
  'Automatic fulfilment back to Shopify',
] as const

/**
 * Stated plainly, because the alternative is a merchant discovering it after
 * they have paid. Each of these was advertised on this site before and is not
 * built.
 */
const NOT_YET = [
  'Email, SMS or push notifications to customers',
  'Captured signatures — proof is a photo and a GPS stamp',
  'Analytics beyond the day’s counts',
  'More than one store on a single account',
] as const

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader />

      <main id="main">
        {/* ---------------------------------------------------------------
            Hero. The answer to "what does it cost" is a sentence, so the
            page gives a sentence rather than staging a table around it.
            --------------------------------------------------------------- */}
        <section className="relative grain overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 -top-56 h-[38rem] w-[38rem] rounded-full opacity-[0.14] blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--ember)) 0%, transparent 65%)',
            }}
          />

          <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-36 md:pb-24 md:pt-44 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="figures text-xs uppercase tracking-[0.2em] text-ink-2">
                Pricing
              </p>

              <h1 className="mt-6 max-w-[16ch] font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
                Priced per store, once we know the store.
              </h1>

              <p className="mt-7 max-w-[56ch] text-lg leading-relaxed text-ink-2">
                What Deliverly costs depends on how many orders come through in a
                month and how many riders are on the road. Those two numbers vary
                enough between merchants that a published table would be wrong for
                most of them.
              </p>

              <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">
                So there is no table. Tell us roughly what your week looks like
                and you get a number back.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-medium text-paper shadow-lg shadow-ink/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 active:translate-y-0 active:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  Tell us about your operation
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/features"
                  className="text-sm font-medium text-ink-2 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ember"
                >
                  See what it does first
                </Link>
              </div>
            </div>

            {/* The two things that actually move the price, shown as the
                inputs they are rather than as decoration. */}
            <div className="lg:col-span-5 lg:pt-6">
              <div className="rounded-2xl border border-ink/[0.08] bg-paper-2/50 p-8">
                <p className="text-xs uppercase tracking-widest text-ink-2/60">
                  What the quote is based on
                </p>

                <dl className="mt-7 space-y-7">
                  <div>
                    <dt className="font-display text-lg font-semibold tracking-tight">
                      Orders a month
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-ink-2">
                      Everything Shopify sends through, however it arrives.
                    </dd>
                  </div>

                  <div className="border-t border-ink/[0.07] pt-7">
                    <dt className="font-display text-lg font-semibold tracking-tight">
                      Riders on the road
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-ink-2">
                      How many people are carrying the app on a given day.
                    </dd>
                  </div>
                </dl>

                <p className="mt-8 border-t border-ink/[0.07] pt-6 text-sm leading-relaxed text-ink-2">
                  Nothing else is metered. There is no per-photo charge and no
                  cost to a delivery that failed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Included / not yet. Side by side deliberately: a list of what you
            get is only worth reading next to a list of what you do not.
            --------------------------------------------------------------- */}
        <section className="border-t border-ink/[0.07] bg-paper-2/60">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                One plan. Nothing held back for a higher one.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">
                There is no version of this where proof of delivery is an upgrade.
              </p>
            </div>

            <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="figures text-xs uppercase tracking-[0.2em] text-ember">
                  Included
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check
                        className="mt-1 h-4 w-4 shrink-0 text-ember"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="figures text-xs uppercase tracking-[0.2em] text-ink-2/60">
                  Not built yet
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {NOT_YET.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Minus
                        className="mt-1 h-4 w-4 shrink-0 text-ink-2/40"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="leading-relaxed text-ink-2">{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-7 max-w-[44ch] text-sm leading-relaxed text-ink-2/80">
                  Listed here rather than discovered later. If one of them is the
                  thing you need, say so — it is useful to know what people are
                  waiting for.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            CTA
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-24 md:pt-28">
          <div className="relative grain overflow-hidden rounded-3xl bg-ink px-8 py-16 text-paper sm:px-14 md:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, hsl(var(--ember)) 0%, transparent 70%)',
              }}
            />

            <div className="relative max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Roughly how many orders, and how many riders?
              </h2>
              <p className="mt-4 leading-relaxed text-paper/65">
                That is genuinely all we need to give you a number.
              </p>

              <Link
                href="/contact"
                className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3.5 font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                Get in touch
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
