import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Clock,
  KeyRound,
  Link2,
  ListChecks,
  MapPin,
  PackageCheck,
  RefreshCw,
  Repeat,
  Route,
  ShieldCheck,
  Signal,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'What Deliverly does: webhook order sync, a dispatch queue, an offline-tolerant rider app, proof of delivery, and fulfilment back to Shopify exactly once.',
}

/**
 * The product has three faces, not twelve features.
 *
 * The previous version of this page was a grid of twelve equal cards, which
 * flattens everything to the same weight and says nothing about who uses what.
 * Deliverly is used by three different people at three different moments —
 * dispatch at a desk, a rider on a doorstep, a customer refreshing a link —
 * and the page is organised that way instead.
 *
 * Every line below is something the code in this repository actually does.
 * Signatures, SMS, push notifications and notification rules were listed here
 * before and are not built, so they are not listed here now.
 */
const SURFACES = [
  {
    eyebrow: 'For dispatch',
    title: 'The dashboard',
    body: 'Where the day is run from. Orders land on their own and leave assigned.',
    items: [
      {
        icon: RefreshCw,
        title: 'Orders arrive by webhook',
        body: 'Shopify calls the moment an order is paid for. Nothing polls, and nobody presses import.',
      },
      {
        icon: ListChecks,
        title: 'One queue for the unassigned',
        body: 'Everything waiting for a rider collects in a single place, so the backlog is a list rather than a feeling.',
      },
      {
        icon: Route,
        title: 'Assign and reassign',
        body: 'Give a stop to a rider, or move it. The change reaches their phone without them refreshing anything.',
      },
      {
        icon: MapPin,
        title: 'Where the riders are',
        body: 'Positions on a map while riders are on shift, with anything stale marked stale rather than drawn as current.',
      },
      {
        icon: Clock,
        title: 'Counts that respect the clock',
        body: 'Today’s numbers use the store’s timezone, so a 1am order counts as tonight and not as yesterday.',
      },
    ],
  },
  {
    eyebrow: 'For riders',
    title: 'The phone',
    body: 'The half of the job that happens where the signal does not reach.',
    items: [
      {
        icon: ListChecks,
        title: 'The stops for this shift',
        body: 'A rider sees their own assigned work and nothing else.',
      },
      {
        icon: Camera,
        title: 'Proof at the door',
        body: 'A photo and a GPS stamp recorded at the doorstep, stored against the delivery.',
      },
      {
        icon: PackageCheck,
        title: 'Delivered, or why not',
        body: 'A failed attempt is a first-class outcome with a reason attached, not a stop that silently stays open.',
      },
      {
        icon: Signal,
        title: 'Written before the network',
        body: 'The delivery is saved to the phone first and sent when there is something to send it over. A basement does not lose it.',
      },
      {
        icon: Repeat,
        title: 'Submitting twice is safe',
        body: 'A request that times out but actually arrived is recognised as the same delivery. It is never counted, or fulfilled, twice.',
      },
    ],
  },
  {
    eyebrow: 'For customers',
    title: 'The tracking link',
    body: 'One page, no account, nothing to install.',
    items: [
      {
        icon: Link2,
        title: 'A code, not a login',
        body: 'The customer opens a link and sees their order. There is no password to forget.',
      },
      {
        icon: Clock,
        title: 'What happened, and when',
        body: 'Received, assigned, out for delivery, delivered — with the times, as they occurred.',
      },
      {
        icon: Camera,
        title: 'The proof photo',
        body: 'Served through a signed URL that expires, so the image is not left sitting on a public address forever.',
      },
    ],
  },
] as const

/**
 * The guarantees, stated as guarantees.
 *
 * These are the parts that took the real work, and they are invisible on a
 * feature grid: they are all about what happens when something goes wrong.
 */
const GUARANTEES = [
  {
    icon: PackageCheck,
    title: 'Fulfilled exactly once',
    body: 'Shopify is told a parcel arrived one time, even when the same delivery is submitted three times from a patchy connection.',
  },
  {
    icon: KeyRound,
    title: 'Riders and staff are separated',
    body: 'Roles live in metadata only the service role can write, and an unrecognised role is denied rather than assumed to be staff.',
  },
  {
    icon: ShieldCheck,
    title: 'Webhooks are verified',
    body: 'Every payload Shopify sends is checked against its HMAC signature before it is allowed to change anything.',
  },
  {
    icon: RefreshCw,
    title: 'Sync survives a real catalogue',
    body: 'First sync was built and corrected against a store with thirteen thousand orders, not against a test fixture with five.',
  },
] as const

export default function FeaturesPage() {
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
              Features
            </p>

            <h1 className="mt-6 max-w-[18ch] font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              Three people use this. They need different things.
            </h1>

            <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-ink-2">
              Dispatch needs to see the whole day at once. A rider needs one stop
              and a camera. A customer needs a link that works. Below is what
              each of them actually gets.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            The three surfaces. Each keeps a sticky label beside its own list,
            so the reader always knows whose view they are reading.
            --------------------------------------------------------------- */}
        {SURFACES.map((surface, index) => (
          <section
            key={surface.title}
            className={
              index % 2 === 1 ? 'border-y border-ink/[0.07] bg-paper-2/60' : ''
            }
          >
            <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:py-24 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="figures text-xs uppercase tracking-[0.2em] text-ember">
                    {surface.eyebrow}
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    {surface.title}
                  </h2>
                  <p className="mt-4 max-w-[38ch] leading-relaxed text-ink-2">
                    {surface.body}
                  </p>
                </div>
              </div>

              <ul className="lg:col-span-8">
                {surface.items.map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    className="group flex gap-5 border-t border-ink/[0.07] py-6 first:border-t-0 first:pt-0"
                  >
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-ink-2/40 transition-colors duration-300 group-hover:text-ember"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div>
                      <h3 className="font-display font-semibold tracking-tight">
                        {title}
                      </h3>
                      <p className="mt-1.5 max-w-[56ch] leading-relaxed text-ink-2">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        {/* ---------------------------------------------------------------
            Guarantees. A dark band, because these are a different kind of
            claim from the feature lists above and should not read as more
            of them.
            --------------------------------------------------------------- */}
        <section className="relative grain bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <div className="max-w-2xl">
              <p className="figures text-xs uppercase tracking-[0.2em] text-paper/40">
                Underneath
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Most of the work went into what happens when something fails.
              </h2>
              <p className="mt-4 leading-relaxed text-paper/65">
                A delivery app is easy while the network holds and nobody taps
                twice. These are the parts that deal with the rest of it.
              </p>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-paper/10 sm:grid-cols-2">
              {GUARANTEES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-ink p-8 sm:p-9">
                  <Icon
                    className="h-5 w-5 text-ember"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-paper/60">
                    {body}
                  </p>
                </div>
              ))}
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
                Easier to watch an order come through than to read about it.
              </h2>
              <p className="mt-4 max-w-[48ch] leading-relaxed text-ink-2">
                Connect a store and the next paid order appears on its own.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-medium text-paper shadow-lg shadow-ink/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 active:translate-y-0 active:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                Open the dashboard
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/pricing"
                className="text-sm font-medium text-ink-2 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ember"
              >
                What it costs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
