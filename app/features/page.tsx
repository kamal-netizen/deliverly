import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  CheckCircle,
  Clock,
  MapPin,
  Smartphone,
  BarChart3,
  Bell,
  Lock
} from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Order Management',
    description: 'Centralized dashboard to view, filter, and manage all your delivery orders. Sync automatically from Shopify with real-time updates.',
    benefits: [
      'Auto-sync with Shopify',
      'Advanced filtering and search',
      'Bulk operations',
      'Order status tracking'
    ]
  },
  {
    icon: Users,
    title: 'Rider Management',
    description: 'Manage your delivery team efficiently with rider profiles, availability tracking, and performance metrics.',
    benefits: [
      'Rider profiles and contact info',
      'Availability management',
      'Performance tracking',
      'Active/inactive status'
    ]
  },
  {
    icon: Zap,
    title: 'Smart Assignment',
    description: 'Quickly assign orders to riders with intelligent recommendations based on location, availability, and workload.',
    benefits: [
      'One-click assignment',
      'Smart recommendations',
      'Reassignment capability',
      'Load balancing'
    ]
  },
  {
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track deliveries in real-time with GPS location updates and estimated delivery times.',
    benefits: [
      'Live GPS tracking',
      'Delivery timeline',
      'Status notifications',
      'Customer tracking page'
    ]
  },
  {
    icon: Shield,
    title: 'Proof of Delivery',
    description: 'Capture photo evidence and signatures on delivery for complete accountability and dispute resolution.',
    benefits: [
      'Photo capture',
      'Digital signatures',
      'Timestamp verification',
      'Secure storage'
    ]
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive analytics dashboard with insights into delivery performance, rider efficiency, and customer satisfaction.',
    benefits: [
      'Performance metrics',
      'Delivery time analysis',
      'Rider efficiency reports',
      'Custom date ranges'
    ]
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Stay informed with real-time notifications for order updates, delivery status changes, and important events.',
    benefits: [
      'Email notifications',
      'SMS alerts (Pro)',
      'Push notifications',
      'Custom notification rules'
    ]
  },
  {
    icon: Smartphone,
    title: 'Mobile Responsive',
    description: 'Access your dashboard from any device with our fully responsive design optimized for mobile and tablet.',
    benefits: [
      'Mobile-first design',
      'Touch-optimized interface',
      'Works offline',
      'Cross-platform'
    ]
  },
  {
    icon: CheckCircle,
    title: 'Shopify Integration',
    description: 'Seamless two-way integration with Shopify. Orders sync automatically and fulfillment updates reflect in both systems.',
    benefits: [
      'Auto order sync',
      'Fulfillment updates',
      'Customer data sync',
      'Easy OAuth setup'
    ]
  },
  {
    icon: Lock,
    title: 'Security & Privacy',
    description: 'Enterprise-grade security with data encryption, role-based access control, and compliance with privacy regulations.',
    benefits: [
      'Data encryption',
      'Role-based access',
      'GDPR compliant',
      'Regular backups'
    ]
  },
  {
    icon: Clock,
    title: 'Delivery Events',
    description: 'Complete delivery history with detailed event logs showing every action taken from assignment to completion.',
    benefits: [
      'Event timeline',
      'Action history',
      'Rider assignments',
      'Status changes'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Scalability',
    description: 'Built to grow with your business. Handle thousands of orders per month without compromising performance.',
    benefits: [
      'Unlimited growth',
      'Fast performance',
      'Auto-scaling',
      'High availability'
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Powerful features for modern delivery management</h1>
          <p className="text-xl text-gray-600">
            Everything you need to run a successful delivery operation, from order management to proof of delivery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-2 hover:border-primary transition-all hover:shadow-lg">
                <CardHeader>
                  <Icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Integration Section */}
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Seamless Shopify Integration</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Connect your Shopify store in seconds and start managing deliveries right away. No technical knowledge required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-semibold mb-2">Quick Setup</h3>
              <p className="text-sm text-gray-600">Connect in under 2 minutes</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="font-semibold mb-2">Real-time Sync</h3>
              <p className="text-sm text-gray-600">Orders update automatically</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="font-semibold mb-2">Secure OAuth</h3>
              <p className="text-sm text-gray-600">Your data stays protected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
