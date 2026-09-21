import { ShoppingBag, ClipboardList, Bike, CheckCheck } from 'lucide-react'

/**
 * The four systems an order passes through, and what moves between them.
 *
 * Animated because the point being made is about movement and ordering — an
 * order leaves Shopify, is assigned, is delivered, and the result goes back.
 * A static row of boxes can show the parts but not the direction, and the
 * direction is the whole idea.
 *
 * Pure CSS: no animation library, and nothing here needs JavaScript or client
 * state, so this stays a server component. Motion is transform and opacity
 * only, and the whole thing holds still under prefers-reduced-motion, where it
 * reads as an ordinary flow chart.
 */
const STAGES = [
  {
    icon: ShoppingBag,
    label: 'Shopify',
    caption: 'Order paid',
    detail:
      'A webhook fires within seconds, signed so only Shopify can send it.',
  },
  {
    icon: ClipboardList,
    label: 'Dispatch',
    caption: 'Rider assigned',
    detail: 'The order lands in the queue and is assigned to whoever is out.',
  },
  {
    icon: Bike,
    label: 'Rider',
    caption: 'Proof captured',
    detail: 'Photo, GPS and outcome, saved on the phone before the network.',
  },
  {
    icon: CheckCheck,
    label: 'Shopify',
    caption: 'Fulfilled',
    detail: 'Marked fulfilled once, and the customer gets their notification.',
  },
]

export function HowItWorks() {
  return (
    <section className="border-y border-ink/[0.07] bg-paper-2/40">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
        <div className="max-w-2xl">
          <p className="figures text-xs uppercase tracking-[0.2em] text-ink-2">
            How it works
          </p>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One order, four systems, no retyping.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Follow a single order from the moment it is paid for to the moment
            Shopify is told it arrived.
          </p>
        </div>

        {/* Desktop: a horizontal track with a packet travelling along it.
            The legs are set as custom properties so the keyframes can stop at
            each node without hard-coding pixel positions. */}
        <div
          className="relative mt-20 hidden md:block"
          style={
            {
              '--leg-1': '33.333%',
              '--leg-2': '66.666%',
              '--leg-3': '100%',
            } as React.CSSProperties
          }
        >
          {/* Rail */}
          <div className="absolute left-[12.5%] right-[12.5%] top-7 h-px bg-ink/10" />
          <div className="absolute left-[12.5%] right-[12.5%] top-7 h-px overflow-hidden">
            <div className="pipeline-line h-px w-full bg-ember/50" />
          </div>

          {/* The packet itself, travelling the rail and pausing at each node. */}
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 -translate-y-1/2">
            <div className="pipeline-packet h-3 w-3 rounded-full bg-ember shadow-[0_0_0_4px_hsl(var(--ember)/0.18)]" />
          </div>

          <ol className="relative grid grid-cols-4 gap-6">
            {STAGES.map(({ icon: Icon, label, caption, detail }, index) => (
              <li key={`${label}-${index}`} className="text-center">
                <div className="relative mx-auto h-14 w-14">
                  {/* Expanding ring, timed to when the packet arrives. */}
                  <span
                    aria-hidden
                    className="pipeline-ring absolute inset-0 rounded-2xl bg-ember/25"
                    style={{ animationDelay: `${index * 2.25}s` }}
                  />
                  <div
                    className="pipeline-node relative flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/[0.08] bg-paper shadow-sm"
                    style={{ animationDelay: `${index * 2.25}s` }}
                  >
                    <Icon className="h-6 w-6 text-ink" strokeWidth={1.5} aria-hidden />
                  </div>
                </div>

                <p className="mt-5 font-display font-semibold tracking-tight">{label}</p>
                <p className="figures mt-1 text-xs uppercase tracking-wider text-ember">
                  {caption}
                </p>
                <p className="mx-auto mt-3 max-w-[24ch] text-sm leading-relaxed text-ink-2">
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile: the same sequence stacked. A horizontal track squeezed into
            360px is unreadable, so it becomes a vertical list rather than a
            scaled-down version of the desktop diagram. */}
        <ol className="mt-14 space-y-8 md:hidden">
          {STAGES.map(({ icon: Icon, label, caption, detail }, index) => (
            <li key={`${label}-${index}`} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-ink/[0.08] bg-paper">
                  <Icon className="h-5 w-5 text-ink" strokeWidth={1.5} aria-hidden />
                </div>
                {index < STAGES.length - 1 && (
                  <div aria-hidden className="mt-2 h-full w-px flex-1 bg-ink/10" />
                )}
              </div>

              <div className="pb-2">
                <p className="font-display font-semibold tracking-tight">{label}</p>
                <p className="figures mt-0.5 text-xs uppercase tracking-wider text-ember">
                  {caption}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
