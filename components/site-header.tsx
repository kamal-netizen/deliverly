'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

/**
 * Navigation for the public pages.
 *
 * These pages previously had no header or footer at all, so every one was a
 * dead end — a visitor who landed on /pricing had no way to anywhere else.
 *
 * The header is transparent over the hero and gains a background once the page
 * scrolls, so it never sits as a hard bar across the top of the first view.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'border-b border-ink/10 bg-paper/85 backdrop-blur-md' : ''
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
          Deliverly
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                // An active marker, so a visitor knows where they are.
                aria-current={active ? 'page' : undefined}
                className={`text-sm transition-colors ${
                  active
                    ? 'font-medium text-ink'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <Link
          href="/login"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Sign in
        </Link>
      </nav>
    </header>
  )
}
