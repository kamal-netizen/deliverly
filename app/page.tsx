import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Delivery Management<br />Made Simple
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Streamline your Shopify delivery operations with real-time tracking, 
            rider management, and automated workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10 text-lg px-8">
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-gray-600">Deliveries Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to manage deliveries</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make delivery management effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Package className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sync orders from Shopify automatically. View, filter, and manage all deliveries in one centralized dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Rider Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Quickly assign riders to orders with smart recommendations and real-time availability tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track performance metrics, delivery times, and rider efficiency with detailed reports and dashboards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Proof of Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Capture photos and signatures on delivery for complete accountability and customer satisfaction.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Live tracking and instant notifications keep everyone in the loop from warehouse to doorstep.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Shopify Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seamless two-way sync with your Shopify store. Orders update automatically across platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple setup process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Your Store</h3>
              <p className="text-gray-600">
                Link your Shopify store in seconds. Orders sync automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Your Riders</h3>
              <p className="text-gray-600">
                Invite your delivery team and set their availability.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Delivering</h3>
              <p className="text-gray-600">
                Assign orders and track deliveries in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by growing businesses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Deliverly transformed how we manage deliveries. Setup took 10 minutes and we saw results immediately.",
                author: "Sarah Johnson",
                role: "Operations Manager",
                company: "Urban Grocers"
              },
              {
                quote: "The real-time tracking and proof of delivery features have reduced our customer support tickets by 60%.",
                author: "Michael Chen",
                role: "Founder",
                company: "Fresh Express"
              },
              {
                quote: "Best delivery management tool we've used. The Shopify integration is seamless and the team loves it.",
                author: "Emily Rodriguez",
                role: "Logistics Director",
                company: "QuickShip Co"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border-2">
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to streamline your deliveries?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses managing their deliveries with Deliverly.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
