import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Mail } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'One address, read by a person. Tell us about your store and your deliveries and you will get a real answer back.',
}

/**
 * The single place to change the public address.
 *
 * Everything on this page routes here, so this constant is the only edit
 * needed if the inbox moves.
 */
const CONTACT_EMAIL = 'deliverly@prismal.ae'

/**
 * Why there is no form here.
 *
 * The previous version had one, and its submit handler was a one-second
 * setTimeout followed by a success toast. Nothing was ever sent anywhere. A
 * visitor who used it was told their message had arrived when it had not —
 * which is worse than having no contact page at all, because they stop waiting
 * for a reply that was never coming.
 *
 * It also listed a phone number in the +1 (555) range and an invented San
 * Francisco street address, alongside a live chat button wired to nothing and
 * documentation links pointing at "#".
 *
 * A form that genuinely sends needs a mail provider and a delivery endpoint.
 * Until that exists, an address a person reads is the honest version, and it
 * is the one thing on this page that is certain to work.
 */

/**
 * Prompts, not required fields. A first email containing these gets a useful
 * reply instead of three rounds of clarification — and they happen to be
 * exactly what a price is quoted from.
 */
const WORTH_MENTIONING = [
  {
    title: 'Roughly how many orders a month',
    body: 'An order of magnitude is plenty. Nobody is holding you to it.',
  },
  {
    title: 'How many riders are on the road',
    body: 'On a normal day rather than at your busiest.',
  },
  {
    title: 'How deliveries are handled today',
    body: 'A spreadsheet and a group chat is a completely normal answer, and a useful one.',
  },
  {
    title: 'Anything that has to work on day one',
    body: 'If there is a hard requirement, it is better to find out now whether it is built.',
  },
] as const

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader />

      <main id="main">
        {/* ---------------------------------------------------------------
            Hero. The address is the page, so it is set as the largest thing
            on it rather than tucked into a card in a sidebar.
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

          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-36 md:pb-24 md:pt-44">
            <p className="figures text-xs uppercase tracking-[0.2em] text-ink-2">
              Contact
            </p>

            <h1 className="mt-6 max-w-[16ch] font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              One address. A person reads it.
            </h1>

            <p className="mt-7 max-w-[54ch] text-lg leading-relaxed text-ink-2">
              No ticket number, no chat widget that turns into a ticket number.
              Write, and you get an answer from someone who can actually tell you
              whether this will work for your store.
            </p>

            {/* The mailto is the primary action on the page, so it is styled
                as the primary action on the page. */}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group mt-12 inline-flex max-w-full items-center gap-3 rounded-2xl border border-ink/[0.08] bg-paper-2/50 px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember sm:gap-4 sm:px-8 sm:py-6"
            >
              <Mail
                className="h-5 w-5 shrink-0 text-ember sm:h-6 sm:w-6"
                strokeWidth={1.75}
                aria-hidden
              />
              {/* break-words rather than break-all: if it has to wrap on a
                  narrow phone it should break at the @ or a dot, not halfway
                  through the domain. */}
              <span className="figures min-w-0 break-words text-base font-medium sm:text-2xl">
                {CONTACT_EMAIL}
              </span>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-ink-2/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
                strokeWidth={1.75}
                aria-hidden
              />
            </a>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            What to say
            --------------------------------------------------------------- */}
        <section className="border-t border-ink/[0.07] bg-paper-2/60">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:py-28 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Worth mentioning
                </h2>
                <p className="mt-4 max-w-[38ch] leading-relaxed text-ink-2">
                  None of it is required. It just saves a round trip, and it is
                  what a price gets worked out from.
                </p>
              </div>
            </div>

            <ul className="lg:col-span-8">
              {WORTH_MENTIONING.map(({ title, body }, index) => (
                <li
                  key={title}
                  className="flex gap-6 border-t border-ink/[0.07] py-6 first:border-t-0 first:pt-0"
                >
                  <span className="figures pt-0.5 text-sm text-ink-2/50">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-1.5 max-w-[54ch] leading-relaxed text-ink-2">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Meanwhile. Two real destinations rather than the previous row of
            documentation, live chat and video tutorials, none of which
            existed or went anywhere.
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-24 md:py-28">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            While you wait for a reply
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/features"
              className="group rounded-2xl border border-ink/[0.08] bg-paper-2/50 p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  What it does
                </h3>
                <ArrowUpRight
                  className="h-5 w-5 shrink-0 text-ink-2/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <p className="mt-3 max-w-[44ch] leading-relaxed text-ink-2">
                The dashboard, the rider app and the customer&rsquo;s tracking
                link, feature by feature — including what is not built.
              </p>
            </Link>

            <Link
              href="/pricing"
              className="group rounded-2xl border border-ink/[0.08] bg-paper-2/50 p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  What it costs
                </h3>
                <ArrowUpRight
                  className="h-5 w-5 shrink-0 text-ink-2/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <p className="mt-3 max-w-[44ch] leading-relaxed text-ink-2">
                How pricing is worked out, and the two numbers it depends on.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
