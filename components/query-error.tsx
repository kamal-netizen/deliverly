import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Failure state for a list query.
 *
 * Worth having as its own component because the alternative - what this app
 * did before - is rendering a backend outage as "No results", which reads as
 * "you have no orders" and sends people looking in the wrong place.
 */
export function QueryError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong loading this data.'

  return (
    <div className="text-center py-12">
      <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
      <p className="font-medium text-gray-900">Could not load this data</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
