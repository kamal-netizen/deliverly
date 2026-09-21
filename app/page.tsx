import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  MapPin,
  PackageCheck,
  RefreshCw,
  Route,
  Signal,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HowItWorks } from '@/components/how-it-works'

/**
 * The delivery lifecycle, as the product actually implements it.
 *
 * A sequence rather than a row of equal cards: the steps happen in order and
 * depend on each other, which three identical boxes side by side cannot say.
 */
const LIFECYCLE = [
  {
    step: '01',
    title: 'Orders arrive on their own',
    body: 'A webhook fires the moment an order is paid for in Shopify. No polling, no importing, no waiting for someone to press sync.',
    icon: RefreshCw,
  },
  {
    step: '02',
    title: 'Dispatch assigns a rider',
    body: 'Unassigned orders collect in one queue. Assign from there and the stop appears on the rider’s phone before they have put it down.',
    icon: Route,
  },
  {
    step: '03',
    title: 'The rider records what happened',
    body: 'A photo at the door, a GPS stamp, and either a delivery or a reason it failed. Captured on the phone first, so a basement does not lose it.',
    icon: Camera,
  },
  {
    step: '04',
    title: 'Shopify finds out',
    body: 'The order is fulfilled back to Shopify automatically, once, even if the same delivery is submitted twice from a patchy connection.',
    icon: PackageCheck,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader />

      <main id="main">
        {/* ---------------------------------------------------------------
            Hero. Left-aligned rather than centred, and asymmetric: the copy
            holds seven columns and the panel five, so the two sides are not
            mirror images of each other.
            --------------------------------------------------------------- */}
        <section className="relative grain overflow-hidden">
          {/* Ambient radial wash rather than a linear gradient banner. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 -top-56 h-[42rem] w-[42rem] rounded-full opacity-[0.16] blur-3xl"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--ember)) 0%, transparent 65%)',
            }}
          />

          <div className="relative mx-auto grid max-w-6xl gap-16 px-5 pb-24 pt-36 md:pb-32 md:pt-44 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="figures text-xs uppercase tracking-[0.2em] text-ink-2">
                Shopify · delivery operations
              </p>

              <h1 className="mt-6 font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[4.25rem]">
                The hours between{' '}
                <span className="relative whitespace-nowrap">
                  paid
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-1 h-3 -rotate-1 bg-ember/25"
                  />
                </span>{' '}
                and delivered.
              </h1>

              <p className="mt-7 max-w-[54ch] text-lg leading-relaxed text-ink-2">
                Shopify handles the sale. Deliverly handles what comes after it —
                assigning riders, proving the parcel arrived, and telling Shopify
                so, without anyone retyping an order number.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-medium text-paper shadow-lg shadow-ink/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/25 active:translate-y-0 active:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  Open the dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                {/* A text link rather than a second bordered button: two equally
                    weighted buttons make neither one the answer. */}
                <Link
                  href="/features"
                  className="text-sm font-medium text-ink-2 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ember"
                >
                  See what it does
                </Link>
              </div>
            </div>

            {/* A slice of the actual product rather than a stock illustration
                of a smiling courier. */}
            <div className="lg:col-span-5 lg:pt-8">
              <TrackingPreview />
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* ---------------------------------------------------------------
            Lifecycle
            --------------------------------------------------------------- */}
        <section className="border-t border-ink/[0.07] bg-paper-2/60">
          <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Four things happen. None of them need a person.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">
                The parts that usually go wrong are the handovers. These are the
                handovers.
              </p>
            </div>

            <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-ink/[0.07] sm:grid-cols-2">
              {LIFECYCLE.map(({ step, title, body, icon: Icon }) => (
                <li
                  key={step}
                  className="group bg-paper p-8 transition-colors duration-300 hover:bg-paper-2 sm:p-10"
                >
                  <div className="flex items-start justify-between gap-6">
                    <span className="figures text-sm text-ink-2/60">{step}</span>
                    <Icon
                      className="h-5 w-5 shrink-0 text-ink-2/40 transition-colors duration-300 group-hover:text-ember"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>

                  <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-[46ch] leading-relaxed text-ink-2">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Offline. The one claim worth a section of its own, because it is
            the thing that actually distinguishes the rider app.
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-24 md:py-28">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 rounded-md bg-ember/10 px-2.5 py-1 text-xs font-medium text-ember">
                <Signal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Built for bad signal
              </span>

              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Basements lose signal. They should not lose deliveries.
              </h2>

              <p className="mt-5 leading-relaxed text-ink-2">
                Every delivery is written to the rider&rsquo;s phone before the
                network is touched, and sent when there is something to send it
                over. A submission that times out but actually arrived is
                recognised as the same delivery, not counted twice.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  icon={Camera}
                  title="Proof at the door"
                  body="A photo and a GPS stamp, held on the phone and uploaded when there is coverage."
                />
                <Detail
                  icon={MapPin}
                  title="Where everyone is"
                  body="Positions while riders are on shift, with anything stale shown as stale rather than current."
                />
                <Detail
                  icon={PackageCheck}
                  title="Fulfilled once"
                  body="Shopify is told exactly once, even if the same delivery is submitted three times."
                  wide
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            CTA
            --------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-8">
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
                Connect a store and watch an order come through.
              </h2>
              <p className="mt-4 leading-relaxed text-paper/65">
                Install takes a few minutes. Orders start arriving on their own
                straight afterwards.
              </p>

              <Link
                href="/login"
                className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3.5 font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                Get started
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

function Detail({
  icon: Icon,
  title,
  body,
  wide = false,
}: {
  icon: typeof Camera
  title: string
  body: string
  wide?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/[0.08] bg-paper-2/50 p-6 transition-colors duration-300 hover:border-ink/[0.16] ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <Icon className="h-5 w-5 text-ember" strokeWidth={1.75} aria-hidden />
      <h3 className="mt-4 font-display font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  )
}

/**
 * A customer-facing tracking card, which is a real screen in the product.
 *
 * Offset and rotated slightly so it overlaps the hero's column rather than
 * sitting squarely beside it.
 */
function TrackingPreview() {
  return (
    <div className="relative mx-auto max-w-sm rotate-1 rounded-2xl border border-ink/[0.08] bg-paper shadow-2xl shadow-ink/[0.08] transition-transform duration-500 hover:rotate-0">
      <div className="flex items-center justify-between border-b border-ink/[0.07] px-6 py-4">
        <span className="figures text-sm font-medium">#14280</span>
        <span className="rounded-md bg-ember/10 px-2 py-0.5 text-xs font-medium text-ember">
          Out for delivery
        </span>
      </div>

      <ol className="space-y-6 px-6 py-7">
        <Step done label="Order received" detail="09:14" />
        <Step done label="Assigned to Adnan" detail="10:02" />
        <Step current label="Out for delivery" detail="Now" />
        <Step label="Delivered" detail="—" />
      </ol>
    </div>
  )
}

function Step({
  label,
  detail,
  done = false,
  current = false,
}: {
  label: string
  detail: string
  done?: boolean
  current?: boolean
}) {
  return (
    <li className="flex items-center gap-4">
      <span
        aria-hidden
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          done ? 'bg-ink' : current ? 'bg-ember ring-4 ring-ember/20' : 'bg-ink/15'
        }`}
      />
      <span
        className={`flex-1 text-sm ${
          done || current ? 'text-ink' : 'text-ink-2/50'
        }`}
      >
        {label}
      </span>
      <span className="figures text-xs text-ink-2/60">{detail}</span>
    </li>
  )
}
