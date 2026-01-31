import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for testing',
    features: [
      'Up to 50 orders/month',
      '2 riders',
      'Basic reporting',
      'Email support',
      'Shopify integration',
      '7-day data retention',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Starter',
    price: '$29',
    description: 'For small businesses',
    features: [
      'Up to 500 orders/month',
      '10 riders',
      'Advanced analytics',
      'Priority support',
      'Shopify integration',
      'Custom branding',
      '90-day data retention',
      'Email notifications',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'For growing teams',
    features: [
      'Unlimited orders',
      'Unlimited riders',
      'Advanced analytics',
      '24/7 Priority support',
      'Shopify integration',
      'Custom branding',
      'API access',
      'Multiple locations',
      'Unlimited data retention',
      'SMS notifications',
      'Custom reports',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large operations',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'Training & onboarding',
      'White-label option',
      'Custom development',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that&apos;s right for your business. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`${plan.popular ? 'border-primary border-2 relative shadow-xl' : 'border-2'} hover:shadow-lg transition-shadow`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.price === 'Custom' ? '/contact' : '/signup'}>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4 font-medium">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Email support
            </span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after the free trial?</h3>
              <p className="text-gray-600">
                Your trial lasts 14 days. After that, you&apos;ll be asked to choose a paid plan. No automatic charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee if you&apos;re not satisfied with our service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
