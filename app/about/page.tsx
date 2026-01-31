import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Target, Users, Award } from 'lucide-react'

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: '👩‍💼',
    bio: '10+ years in logistics and e-commerce'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: '👨‍💻',
    bio: 'Former engineer at major tech companies'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Product',
    image: '👩‍🎨',
    bio: 'Product design specialist with UX expertise'
  },
  {
    name: 'David Kim',
    role: 'Head of Support',
    image: '👨‍💼',
    bio: 'Dedicated to customer success'
  }
]

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We prioritize our customers\' success above all else'
  },
  {
    icon: Target,
    title: 'Innovation',
    description: 'Constantly improving and adapting to new challenges'
  },
  {
    icon: Users,
    title: 'Teamwork',
    description: 'Collaboration drives our success'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Committed to delivering the best service'
  }
]

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">About Deliverly</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're on a mission to simplify delivery management for e-commerce businesses worldwide. 
            Built by logistics experts who understand the challenges of last-mile delivery.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Deliverly was born out of frustration with existing delivery management tools. As e-commerce 
                business owners ourselves, we experienced firsthand the chaos of managing orders, coordinating 
                with riders, and keeping customers informed.
              </p>
              <p>
                In 2022, we decided to build the solution we wished existed - a simple, powerful platform that 
                connects seamlessly with Shopify and makes delivery management effortless.
              </p>
              <p>
                Today, we're proud to serve over 500 businesses processing thousands of deliveries every day. 
                Our platform has evolved based on real-world feedback from our users, and we continue to 
                innovate and improve every single day.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 text-center">
            <div className="space-y-8">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">500+</div>
                <div className="text-gray-600">Active Businesses</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">10k+</div>
                <div className="text-gray-600">Daily Deliveries</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <Card key={value.title} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Meet Our Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're a diverse team of engineers, designers, and logistics experts passionate about 
            solving real problems for e-commerce businesses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <Card key={member.name} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Join thousands of businesses</h2>
          <p className="text-xl mb-8 opacity-90">
            Start managing your deliveries more efficiently today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="/signup">Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <a href="/contact">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
