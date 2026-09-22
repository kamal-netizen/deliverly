'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Copy, Download, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Where the rider APK is served from.
 *
 * Hosted by this app: the file lives in public/ and is served from the same
 * origin as the dashboard, so there is nothing to configure and nothing that
 * can rot. A rider can install it from any network that can reach the
 * dashboard.
 *
 * The environment variable is an override rather than a requirement. If the
 * APK later moves to a GitHub release or a CDN - which is the sensible thing
 * once it outgrows being committed here - set NEXT_PUBLIC_RIDER_APP_URL to its
 * address and nothing else has to change.
 */
const SELF_HOSTED_PATH = '/deliverly-rider.apk'
const APK_URL = process.env.NEXT_PUBLIC_RIDER_APP_URL || SELF_HOSTED_PATH

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
    // A relative path is no use in a message, so resolve it against the origin
    // the dashboard is actually being served from. That also means the link a
    // rider receives points at whichever host the dispatcher is using, rather
    // than a domain hardcoded somewhere.
    const shareable = APK_URL.startsWith('http')
      ? APK_URL
      : new URL(APK_URL, window.location.origin).toString()

    try {
      await navigator.clipboard.writeText(shareable)
      setCopied(true)
      toast.success('Link copied — send it to your rider')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is refused outside a secure context, which on a
      // dashboard served over plain http in development is the normal case
      // rather than a fault. Show the link so it can be copied by hand.
      toast.error(shareable, { duration: 8000 })
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

        {/* Worth saying once, here, rather than fielding it by phone from a
            rider standing in a car park. The app is not on the Play Store, so
            Android warns before installing it. */}
        <p className="mt-4 text-sm text-gray-500">
          The app is installed directly rather than from the Play Store, so
          Android asks the rider to allow installs from this source the first
          time. That prompt is expected.
        </p>
      </CardContent>
    </Card>
  )
}
