import Link from 'next/link'

/**
 * Footer for the public pages.
 *
 * Two columns, not the four-column link farm the audit warns about — there are
 * six destinations on this site and pretending otherwise is padding.
 *
 * Dark on a light page, deliberately and only here: a single dark band at the
 * very end reads as a terminus, where the same jump mid-page would read as a
 * mistake.
 */
export function SiteFooter() {
  return (
    <footer className="relative grain mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-xl font-bold tracking-tight">Deliverly</p>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              Delivery operations for Shopify stores. Built for the hours between
              an order being paid for and a parcel reaching a door.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs uppercase tracking-widest text-paper/40">Product</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link href="/features" className="text-paper/70 transition-colors hover:text-paper">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-paper/70 transition-colors hover:text-paper">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-paper/70 transition-colors hover:text-paper">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-paper/40">Company</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link href="/about" className="text-paper/70 transition-colors hover:text-paper">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-paper/70 transition-colors hover:text-paper">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/10 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Deliverly</p>
          {/* Legal links: the audit's first strategic omission. */}
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-paper/70">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-paper/70">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
