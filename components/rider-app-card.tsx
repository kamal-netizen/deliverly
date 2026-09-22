'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Copy, Download, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Where the rider APK is hosted.
 *
 * Deliberately configuration rather than a committed file. The APK is ~25MB,
 * this repository is what Shipyard deploys from, and a binary that size in git
 * is paid for on every clone and every deploy, forever, once per build.
 *
 * GitHub Releases on the rider repository is the natural host, and its "latest"
 * URL is stable, so the dashboard never needs updating when a new build ships:
 *
 *   https://github.com/<owner>/deliverly-rider/releases/latest/download/<file>.apk
 */
const APK_URL = process.env.NEXT_PUBLIC_RIDER_APP_URL ?? ''

/**
 * Getting the app onto a rider's phone.
 *
 * This sits on the riders page rather than in settings because it is not a
 * setting - it is the next thing a dispatcher needs the moment they have
 * finished adding someone.
 *
 * The copy button matters more than the download button: the dispatcher is
 * almost never the person installing it. They are sending a link to a rider
 * over WhatsApp.
 */
export function RiderAppCard() {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APK_URL)
      setCopied(true)
      toast.success('Link copied — send it to your rider')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is refused outside a secure context, and on a
      // dashboard served over plain http in development that is the normal
      // case rather than an error worth a red toast.
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Rider app
        </CardTitle>
        <CardDescription>
          Android. Riders sign in with the email and password you set when adding
          them.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {APK_URL ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <a href={APK_URL} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download APK
                </a>
              </Button>

              <Button variant="outline" onClick={copyLink}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy link for a rider'}
              </Button>
            </div>

            {/* Worth saying once, here, rather than fielding it by phone. The
                app is not on the Play Store, so Android will warn. */}
            <p className="mt-4 text-sm text-gray-500">
              The app is installed directly rather than from the Play Store, so
              Android asks the rider to allow installs from this source the first
              time. That prompt is expected.
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-medium">No download link configured yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Host the APK — a GitHub release on the rider repository is the
              simplest option — then set{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                NEXT_PUBLIC_RIDER_APP_URL
              </code>{' '}
              to its address and redeploy. The link appears here once it is set.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
